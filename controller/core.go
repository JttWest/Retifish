package controller

import (
	"file-sharing-test/model/websocket_broker"
	"errors"
	"file-sharing-test/model"
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

func (c *Core) InitTransferSession(fileName, passcode string, fileSize int64) (string, error) {
	randUUID, err := uuid.NewV4()
	if err != nil {
		return "", errors.New("failed to create UUID")
	}

	newSession := &model.FileTransferSession{
		FileName:     fileName,
		FileSize:     fileSize,
		Passcode:     passcode,
		CreateTime:   time.Now(),
	}

	sessionID := randUUID.String()
	c.sessionManager.AddTransferSession(sessionID, newSession)

	// TODO: clear session after delay if SenderBroker is still nil

	return sessionID, nil
}

func (c *Core) LoadSenderBroker(sessionID string, conn *websocket.Conn) error {
	// set handler to remove transfer session on socket close
	oldCloseHandler := conn.CloseHandler()
	newCloseHandler := func(code int, text string) error {
		c.sessionManager.RemoveTransferSession(sessionID) // remove session

		return oldCloseHandler(code, text)
	}
	conn.SetCloseHandler(newCloseHandler)

	// create SenderBroker
	senderBroker := websocketbroker.New(conn)

	if err := c.sessionManager.LoadSenderBroker(sessionID, senderBroker); err != nil {
		return err
	}

	// start broker after it is loaded to prevent leak
	senderBroker.Start()

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
