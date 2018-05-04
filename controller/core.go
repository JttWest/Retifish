package controller

import (
	"errors"
	"file-sharing-test/model"
	"file-sharing-test/model/message"
	"time"

	"github.com/gorilla/websocket"
	"github.com/satori/go.uuid"
)

type Core struct {
	sessionManager *model.SessionManager
}

func NewCore() *Core {
	return &Core{
		sessionManager: model.NewSessionManager(),
	}
}

func (c *Core) CreateTransferSession(conn *websocket.Conn, fileName, passcode string, fileSize int64) error {
	randUUID, err := uuid.NewV4()

	if err != nil {
		return errors.New("failed to create UUID")
	}

	newSession := &model.FileTransferSession{
		FileName:     fileName,
		FileSize:     fileSize,
		Passcode:     passcode,
		CreateTime:   time.Now(),
		NumReceivers: 0,
		SenderWS:     conn,
	}

	sessionID := randUUID.String()

	// send session info thru sender WS
	sessionInfoMessage := message.NewSessionInfo(sessionID, fileName, fileSize)
	if err = conn.WriteJSON(sessionInfoMessage); err != nil {
		return errors.New("failed to send session info")
	}

	c.sessionManager.AddTransferSession(sessionID, newSession)

	oldCloseHandler := conn.CloseHandler()
	newCloseHandler := func(code int, text string) error {
		c.sessionManager.RemoveTransferSession(sessionID) // remove session

		return oldCloseHandler(code, text)
	}
	conn.SetCloseHandler(newCloseHandler)

	return nil
}

func (c *Core) GetFileTransferSession(sessionID string) (*model.FileTransferSession, error) {
	fts, err := c.sessionManager.GetTransferSession(sessionID)

	if err != nil {
		return nil, err
	}

	return fts, nil
}

func (c *Core) Info() map[string]interface{} {
	return c.sessionManager.Info()
}
