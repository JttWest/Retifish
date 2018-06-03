package logger

import (
	"fmt"
	"log"
	"os"
	"time"
)

var currentLevel = 0

func init() {
	log.SetFlags(0)
}

func SetLevel(level int) {
	if level < 0 || level > 4 {
		Fatal(fmt.Sprintf("Invalid log level: %v", level))
	}

	currentLevel = level
}

func SetLogToFile(logFileName string) {
	logFile, err := os.OpenFile(logFileName, os.O_RDWR|os.O_CREATE|os.O_APPEND, 0600)
	if err != nil {
		Fatal("Failed to create log file.")
	}

	log.SetOutput(logFile)
}

func Debug(message ...string) {
	println(levels.Debug, message...)
}

func Info(message ...string) {
	println(levels.Info, message...)
}

func Warn(message ...string) {
	println(levels.Warn, message...)
}

func Error(message ...string) {
	println(levels.Error, message...)
}

func Fatal(message ...string) {
	println(levels.Fatal, message...)
	os.Exit(1)
}

func println(level int, message ...string) {
	if level < currentLevel {
		return
	}

	logMessage := fmt.Sprintf("%v %v %v", time.Now().Format("06/01/02 15:04"), levelName[level], message)

	log.Println(logMessage)
}
