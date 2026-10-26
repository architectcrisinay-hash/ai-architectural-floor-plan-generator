//go:build !windows

package main

import (
	"os/exec"
	"runtime"
	"syscall"
)

// sysProcAttr is a no-op elsewhere so the launcher can also be compiled and
// smoke-tested on Linux/macOS.
func sysProcAttr() *syscall.SysProcAttr {
	return &syscall.SysProcAttr{}
}

// openBrowser opens the URL with the platform's default handler.
func openBrowser(url string) {
	var cmd *exec.Cmd
	if runtime.GOOS == "darwin" {
		cmd = exec.Command("open", url)
	} else {
		cmd = exec.Command("xdg-open", url)
	}
	_ = cmd.Start()
}
