package model

import (
	"errors"
	"fmt"
	"retifish/server/config"
	"retifish/server/controller/model/websocket_broker"
	log "retifish/server/logger"
	"retifish/server/util"
	"sync"
	"time"
)

const (
	writeWait = 15 * time.Second
	readWait  = 60 * time.Second
)

var chunkSize = config.Values.TransferChunkSize

// FileTransferSession is use to facilitate file transfer b/w sender and receiver
type FileTransferSession struct {
	mu           sync.RWMutex
	FileName     string
	FileSize     int64
	FileType     string
	Passcode     string // optional passcode to validate receiver
	CreateTime   time.Time
	numReceivers int
	senderBroker *websocketbroker.WebsocketBroker
}

type fileTransferSessionInfo struct {
	FileName     string
	FileSize     int64
	FileType     string
	Passcode     string // optional passcode to validate receiver
	CreateTime   time.Time
	NumReceivers int
}

func (fts *FileTransferSession) HasSenderBroker() bool {
	fts.mu.RLock()
	defer fts.mu.RUnlock()

	return fts.senderBroker != nil
}

func (fts *FileTransferSession) LoadSenderBroker(senderBroker *websocketbroker.WebsocketBroker) error {
	fts.mu.Lock()
	defer fts.mu.Unlock()

	if fts.senderBroker != nil {
		return errors.New("session already has a SenderBroker")
	}

	fts.senderBroker = senderBroker
	return nil
}

func (fts *FileTransferSession) Info() fileTransferSessionInfo {
	fts.mu.RLock()
	defer fts.mu.RUnlock()

	return fileTransferSessionInfo{fts.FileName, fts.FileSize, fts.FileType, fts.Passcode, fts.CreateTime, fts.numReceivers}
}

func (fts *FileTransferSession) IncReceiverCounter() {
	fts.mu.Lock()
	defer fts.mu.Unlock()

	fts.numReceivers++
}

func (fts *FileTransferSession) DecReceiverCounter() {
	fts.mu.Lock()
	defer fts.mu.Unlock()

	if fts.numReceivers == 0 {
		log.Warn("Attempting to decrement ReceiverCounter when it's already 0")
	} else {
		fts.numReceivers--
	}
}

// pump will begin pulling file data [offsetByte, finishByte) from sender and
// send each pulled chunk through receiverChan
func (fts *FileTransferSession) pump(offsetByte, finishByte int64, chunkSize int,
	receiverChan chan<- []byte) {
	defer close(receiverChan)

	log.Info(fmt.Sprintf("Pumping %v (%v - %v)", fts.FileName, offsetByte, finishByte))

	var endByte int64
	for offsetByte < finishByte {
		endByte = util.MinInt64(offsetByte+int64(chunkSize), finishByte)

		// send transaction to broker
		chunk, ok := fts.senderBroker.SubmitTransaction(
			websocketbroker.NewPullChunkMsg(offsetByte, endByte),
			make(chan []byte))

		if !ok {
			return
		}

		// pass result to receiver
		select {
		case receiverChan <- chunk:
		case <-time.After(30 * time.Second):
			return
		}

		offsetByte = endByte
	}
}

func (fts *FileTransferSession) ReceiveFileByPump(sessionID string, startByte, endByte int64) (chan []byte, error) {

	fts.mu.RLock()
	if fts.numReceivers > 1 {
		return nil, errors.New("only one receiver allow per session")
	}

	if fts.senderBroker == nil {
		return nil, errors.New("session missing SenderBroker")
	}
	fts.mu.RUnlock()

	// create pump
	receiverChan := make(chan []byte, 1)
	// receiverChan will be close by the goroutine below
	go fts.pump(startByte, endByte, chunkSize, receiverChan)

	// return pump
	return receiverChan, nil
}
