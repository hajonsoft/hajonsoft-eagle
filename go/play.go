package main

import (
	"github.com/go-rod/rod"
	"time"
)

func main(){
	page := rod.New().NoDefaultDevice().MustConnect().MustPage("https://ehaj.haj.gov.sa/")
	page.MustWindowFullscreen()
    page.MustWaitLoad().MustScreenshot("a.png")
    time.Sleep(time.Hour)
}

