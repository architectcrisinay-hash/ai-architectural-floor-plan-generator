//go:build windows

package main

import (
	"os/exec"
	"syscall"
)

// sysProcAttr hides the extra console window that Windows would otherwise
// create for the child node.exe process.
func sysProcAttr() *syscall.SysProcAttr {
	const createNoWindow = 0x08000000
	return &syscall.SysProcAttr{
		HideWindow:    true,
		CreationFlags: createNoWindow,
	}
}

// openBrowser hands the URL to the Windows shell so the default browser opens.
func openBrowser(url string) {
	_ = exec.Command("rundll32", "url.dll,FileProtocolHandler", url).Start()
}
