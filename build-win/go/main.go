// Command villa-planner builds a single self-contained Windows .exe from the
// Next.js standalone bundle.
//
// At runtime the launcher:
//  1. Extracts its embedded app.zip + node.exe into %LOCALAPPDATA% (once, or
//     when the embedded build ID changes).
//  2. Starts node.exe server.js with the chosen PORT.
//  3. Prints the URL, waits for the server to answer, then opens the browser.
//  4. Waits for the user to press Ctrl+C and shuts the server down cleanly.
//
// Build (cross-compile from Linux):
//
//	GOOS=windows GOARCH=amd64 go build -ldflags="-s -w" -o VillaPlanner.exe .
package main

import (
	"archive/zip"
	"bufio"
	"bytes"
	"embed"
	"fmt"
	"io"
	"net"
	"net/http"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"
	"time"
)

//go:embed assets/app.zip assets/node.exe
var assets embed.FS

const appName = "AIVillaPlanner"

// buildStamp is injected at link time via -X main.buildStamp=...
var buildStamp = "dev"

func main() {
	if err := run(); err != nil {
		fmt.Fprintf(os.Stderr, "\nERROR: %v\n", err)
		fmt.Fprintf(os.Stderr, "\nPress Enter to close...\n")
		_, _ = bufio.NewReader(os.Stdin).ReadString('\n')
		os.Exit(1)
	}
}

func run() error {
	fmt.Println("==========================================================")
	fmt.Println("  AI Villa Planner")
	fmt.Println("==========================================================")
	fmt.Println()

	base, err := baseDir()
	if err != nil {
		return fmt.Errorf("cannot determine install directory: %w", err)
	}

	appDir := filepath.Join(base, "app-"+buildStamp)
	nodePath := filepath.Join(base, "node.exe")

	// Extract once per build. The build stamp is in the directory name, so a
	// new .exe automatically gets a fresh, correct app directory.
	if _, statErr := os.Stat(filepath.Join(appDir, "server.js")); statErr != nil {
		fmt.Println("First run: unpacking application files (this takes a moment)...")
		if err := os.MkdirAll(appDir, 0o755); err != nil {
			return fmt.Errorf("cannot create app directory: %w", err)
		}
		if err := extractZip("assets/app.zip", appDir); err != nil {
			return fmt.Errorf("failed to unpack application: %w", err)
		}
		if err := extractFile("assets/node.exe", nodePath); err != nil {
			return fmt.Errorf("failed to unpack runtime: %w", err)
		}
		fmt.Println("Unpacked successfully.")
		fmt.Println()
	}

	port, err := freePort()
	if err != nil {
		return fmt.Errorf("no free port available: %w", err)
	}
	url := fmt.Sprintf("http://localhost:%d", port)

	fmt.Printf("Starting server on port %d ...\n", port)

	nodeArgs := []string{filepath.Join("app-"+buildStamp, "server.js")}
	cmd := exec.Command(nodePath, nodeArgs...)
	cmd.Dir = base
	cmd.Env = append(os.Environ(),
		"NODE_ENV=production",
		fmt.Sprintf("PORT=%d", port),
		"HOSTNAME=127.0.0.1",
	)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	// Hide the console window that would flash on Windows for child procs.
	cmd.SysProcAttr = sysProcAttr()

	if err := cmd.Start(); err != nil {
		return fmt.Errorf("failed to start server: %w", err)
	}

	// Make sure we always tear the child down, even on Ctrl+C termination.
	cleanup := func() {
		if cmd.Process != nil {
			_ = cmd.Process.Kill()
			_, _ = cmd.Process.Wait()
		}
	}
	defer cleanup()

	if !waitForServer(url, 40*time.Second) {
		return fmt.Errorf("server did not become ready in time")
	}

	fmt.Println()
	fmt.Println("==========================================================")
	fmt.Printf("  Ready:  %s\n", url)
	fmt.Println("  Close this window or press Ctrl+C to stop.")
	fmt.Println("==========================================================")
	fmt.Println()

	openBrowser(url)

	// Block until Ctrl+C / window close, then shut the server down.
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)
	<-stop

	fmt.Println("\nShutting down...")
	cleanup()
	return nil
}

// baseDir returns the directory where extracted files live. Using
// %LOCALAPPDATA% avoids permission problems when the .exe sits in Program
// Files or a read-only folder.
func baseDir() (string, error) {
	root := os.Getenv("LOCALAPPDATA")
	if root == "" {
		var err error
		root, err = os.UserCacheDir()
		if err != nil {
			return "", err
		}
	}
	dir := filepath.Join(root, appName)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return "", err
	}
	return dir, nil
}

func extractZip(assetPath, dest string) error {
	data, err := assets.ReadFile(assetPath)
	if err != nil {
		return err
	}
	zr, err := zip.NewReader(bytes.NewReader(data), int64(len(data)))
	if err != nil {
		return err
	}
	for _, f := range zr.File {
		target := filepath.Join(dest, f.Name)

		// Guard against zip-slip path traversal.
		if !strings.HasPrefix(target, filepath.Clean(dest)+string(os.PathSeparator)) {
			return fmt.Errorf("unsafe path in archive: %s", f.Name)
		}
		if f.FileInfo().IsDir() {
			if err := os.MkdirAll(target, 0o755); err != nil {
				return err
			}
			continue
		}
		if err := os.MkdirAll(filepath.Dir(target), 0o755); err != nil {
			return err
		}
		rc, err := f.Open()
		if err != nil {
			return err
		}
		out, err := os.OpenFile(target, os.O_CREATE|os.O_TRUNC|os.O_WRONLY, 0o644)
		if err != nil {
			rc.Close()
			return err
		}
		_, copyErr := io.Copy(out, rc)
		out.Close()
		rc.Close()
		if copyErr != nil {
			return copyErr
		}
	}
	return nil
}

func extractFile(assetPath, dest string) error {
	data, err := assets.ReadFile(assetPath)
	if err != nil {
		return err
	}
	return os.WriteFile(dest, data, 0o755)
}

// freePort asks the OS for an unused port on the loopback interface.
func freePort() (int, error) {
	l, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		return 0, err
	}
	defer l.Close()
	return l.Addr().(*net.TCPAddr).Port, nil
}

// waitForServer polls the URL until it answers or the timeout expires.
func waitForServer(url string, timeout time.Duration) bool {
	deadline := time.Now().Add(timeout)
	client := &http.Client{Timeout: 2 * time.Second}
	for time.Now().Before(deadline) {
		resp, err := client.Get(url)
		if err == nil {
			resp.Body.Close()
			if resp.StatusCode < 500 {
				return true
			}
		}
		time.Sleep(400 * time.Millisecond)
	}
	return false
}
