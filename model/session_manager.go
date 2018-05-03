package model

import (
	"errors"
	"sync"
)

type SessionManager struct {
	mu                  sync.RWMutex
	fileTransferSession map[string]*FileTransferSession
}

func NewSessionManager() *SessionManager {
	return &SessionManager{sync.RWMutex{}, make(map[string]*FileTransferSession)}
}

func (sm *SessionManager) AddTransferSession(sessionID string, fts *FileTransferSession) {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	sm.fileTransferSession[sessionID] = fts
}

func (sm *SessionManager) RemoveTransferSession(sessionID string) {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	delete(sm.fileTransferSession, sessionID)
}

func (sm *SessionManager) GetTransferSession(sessionID string) (*FileTransferSession, error) {
	sm.mu.RLock()
	defer sm.mu.RUnlock()

	if session, ok := sm.fileTransferSession[sessionID]; ok {
		return session, nil
	}

	return nil, errors.New("session does not exist")
}

func (sm *SessionManager) Info() map[string]interface{} {
	sm.mu.RLock()
	defer sm.mu.RUnlock()

	info := make(map[string]interface{})

	for sessionID, session := range sm.fileTransferSession {
		info[sessionID] = session.Info()
	}

	return info
}
