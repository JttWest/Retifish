package model

import (
	"errors"
	"retifish/server/config"
	"retifish/server/controller/model/websocket_broker"
	"sync"
	"time"
)

type SessionManager struct {
	mu                   sync.RWMutex
	fileTransferSessions map[string]*FileTransferSession
}

func NewSessionManager() *SessionManager {
	return &SessionManager{sync.RWMutex{}, make(map[string]*FileTransferSession)}
}

func (sm *SessionManager) AddTransferSession(sessionID string, fts *FileTransferSession) error {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	if len(sm.fileTransferSessions) < config.Values.MaxTransferSessions {
		sm.fileTransferSessions[sessionID] = fts

		// remove session if sender didn't connect WS in time
		go func() {
			time.Sleep(config.Values.SenderConnectWsTimeoutS * time.Second)

			session, err := sm.GetTransferSession(sessionID)
			if err != nil {
				return
			}

			if !session.HasSenderBroker() {
				sm.RemoveTransferSession(sessionID)
			}
		}()

		return nil
	}

	return errors.New("max transfer capacity")
}

func (sm *SessionManager) RemoveTransferSession(sessionID string) {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	delete(sm.fileTransferSessions, sessionID)
}

func (sm *SessionManager) GetTransferSession(sessionID string) (*FileTransferSession, error) {
	sm.mu.RLock()
	defer sm.mu.RUnlock()

	if session, ok := sm.fileTransferSessions[sessionID]; ok {
		return session, nil
	}

	return nil, errors.New("session does not exist")
}

func (sm *SessionManager) Info() map[string]interface{} {
	sm.mu.RLock()
	defer sm.mu.RUnlock()

	info := make(map[string]interface{})

	for sessionID, session := range sm.fileTransferSessions {
		info[sessionID] = session.Info()
	}

	return info
}

func (sm *SessionManager) LoadSenderBroker(sessionID string, senderBroker *websocketbroker.WebsocketBroker) error {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	session, ok := sm.fileTransferSessions[sessionID]
	if !ok {
		return errors.New("session doesn't exist")
	}

	// return err or nil from LoadSenderBroker
	return session.LoadSenderBroker(senderBroker)
}
