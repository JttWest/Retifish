package logger

var levelName = map[int]string {
    0: "DEBUG",
    1: "INFO" ,
	2: "WARN" ,
	3: "ERROR",
	4: "FATAL",
}

var levels = struct {
	Debug int
	Info  int
	Warn  int
	Error int
	Fatal int
}{0, 1, 2, 3, 4}
