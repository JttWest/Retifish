package message

// Message is the top-level protocol for communication b/w client and server
type Message struct {
	Type string      `json:"type"`
	Data interface{} `json:"data"`
}
