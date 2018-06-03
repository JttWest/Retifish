package server

func decodeError(err error) string {
	msg := ""

	switch err.Error() {
	case "max transfer sessions reached":
		msg = "The server is at maximum transfer capacity. Please try again later."
	case "session does not exist":
		msg = "Session does not exist. Please double check your session ID."
	}

	return msg
}
