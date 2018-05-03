package message

func NewSessionInfo(sessionID, fileName string, fileSize int64) *Message {
	data := map[string]interface{}{
		"sessionID": sessionID,
		"fileName":  fileName,
		"fileSize":  fileSize,
	}

	return &Message{Type: "sessionInfo", Data: data}
}

func NewPullChunk(startByte, endByte int64) *Message {
	data := map[string]interface{}{
		"startByte": startByte,
		"endByte":  endByte,
	}

	return &Message{Type: "pullChunk", Data: data}
}
