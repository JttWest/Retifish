package websocketbroker

// type incomingMessage struct {
// 	Type int
// 	Data []byte
// }

// type outgoingMessage struct {
// 	Type int
// 	Data []byte
// }

// Message is the top-level protocol for communication b/w client and server
type message struct {
	Type string      `json:"type"`
	Data interface{} `json:"data"`
}

func NewSessionInfoMsg(sessionID, fileName string, fileSize int64) *message {
	data := map[string]interface{}{
		"sessionID": sessionID,
		"fileName":  fileName,
		"fileSize":  fileSize,
	}

	return &message{Type: "sessionInfo", Data: data}
}

func NewPullChunkMsg(startByte, endByte int64) *message {
	data := map[string]interface{}{
		"startByte": startByte,
		"endByte":   endByte,
	}

	return &message{Type: "pullChunk", Data: data}
}
