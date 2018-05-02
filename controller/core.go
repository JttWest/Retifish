package controller

import (
	"errors"
	"file-sharing-test/model"

	"github.com/gorilla/websocket"
	"github.com/satori/go.uuid"
)

type Core struct {
	FileTransferSession map[string]*model.FileTransferSession // TODO: change to sync.Map
}

func NewCore() *Core {
	return &Core{
		FileTransferSession: make(map[string]*model.FileTransferSession),
	}
}

func (c *Core) removeTransferSession(sessionID string) {
	// TODO
}

func (c *Core) CreateTransferSession(conn *websocket.Conn, fileName, passcode string, fileSize int64) (string, error) {
	randUUID, err := uuid.NewV4()

	if err != nil {
		return "", errors.New("failed to create UUID")
	}

	newSession := &model.FileTransferSession{
		FileName:     fileName,
		FileSize:     fileSize,
		Passcode:     passcode,
		NumReceivers: 0,
		SenderWS:     conn,
	}

	randSessionID := randUUID.String()
	c.FileTransferSession[randSessionID] = newSession

	newCloseHandler := func(code int, text string) error {
		// remove session
		c.removeTransferSession(randSessionID)

		oldCloseHandler := conn.CloseHandler()

		return oldCloseHandler(code, text)
	}

	conn.SetCloseHandler(newCloseHandler)

	return randSessionID, nil
}

func (c *Core) GetFileTransferSession(sessionID string) (*model.FileTransferSession, error) {
	// return c.FileTransferSession[sessionID]

	fts, hasKey := c.FileTransferSession[sessionID]

	if hasKey == false {
		return nil, errors.New("session does not exist")
	}

	return fts, nil
}
