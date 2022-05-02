package main

import (
	"errors"
	"fmt"
	"time"
	"github.com/go-rod/rod"
)

func main() {
	page := rod.New().MustConnect().MustPage("https://github.com").MustWaitLoad()

	// simple version
	page.MustScreenshot("my.png")

	// customization version
	// img, _ := page.Screenshot(true, &proto.PageCaptureScreenshot{
	// 	Format:  proto.PageCaptureScreenshotFormatJpeg,
	// 	Quality: gson.Int(90),
	// 	Clip: &proto.PageViewport{
	// 		X:      0,
	// 		Y:      0,
	// 		Width:  300,
	// 		Height: 200,
	// 		Scale:  1,
	// 	},
	// 	FromSurface: true,
	// })
	// _ = utils.OutputFile("my.jpg", img)
}


