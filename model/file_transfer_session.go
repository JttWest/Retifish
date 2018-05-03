package model

import (
	"time"
	"errors"
	"file-sharing-test/model/message"
	"file-sharing-test/util"
	"log"
	"sync"

	"github.com/gorilla/websocket"
)

// FileTransferSession is use to facilitate file transfer b/w sender and receiver
type FileTransferSession struct {
	mu           sync.RWMutex
	FileName     string
	FileSize     int64
	Passcode     string // optional passcode to validate receiver
	CreateTime   time.Time
	NumReceivers int
	SenderWS     *websocket.Conn
}

type fileTransferSessionInfo struct {
	FileName     string
	FileSize     int64
	Passcode     string // optional passcode to validate receiver
	CreateTime   time.Time
	NumReceivers int
}

func (fts *FileTransferSession) Info() fileTransferSessionInfo {
	fts.mu.RLock()
	defer fts.mu.RUnlock()

	return fileTransferSessionInfo{fts.FileName, fts.FileSize, fts.Passcode, fts.CreateTime, fts.NumReceivers}
}

func (fts *FileTransferSession) IncReceiverCounter() {
	fts.mu.Lock()
	defer fts.mu.Unlock()

	fts.NumReceivers++
}

func (fts *FileTransferSession) DecReceiverCounter() {
	fts.mu.Lock()
	defer fts.mu.Unlock()

	if fts.NumReceivers == 0 {
		log.Println("ReceiverCounter already 0")
		return
	}

	fts.NumReceivers--
}

//var pullChunkMessage = interface{}

// pump will begin pulling file data [offsetByte, finishByte) from sender and
// send each pulled chunk through receiverChan
func (fts *FileTransferSession) pump(offsetByte, finishByte int64, chunkSize int,
	receiverChan chan<- []byte, shutdownPumpSignal <-chan bool) {

	fts.mu.RLock()
	sendWS := fts.SenderWS
	fts.mu.RUnlock()

	defer close(receiverChan) // done pulling chunks

	var endByte int64
	for offsetByte < finishByte {
		endByte = util.MaxInt64(offsetByte+int64(chunkSize), finishByte)

		if err := sendWS.WriteJSON(message.NewPullChunk(offsetByte, endByte)); err != nil {
			return
		}

		messageType, wsData, err := sendWS.ReadMessage()
		if err != nil {
			return
		}

		if messageType == websocket.BinaryMessage {
			if len(wsData) > chunkSize {
				log.Println("File chunk data larger than chunk size!")
				return
			}

			select {
			case receiverChan <- wsData: // send chunk to receiver
			case <-shutdownPumpSignal:
				return
			}
		} else {
			log.Println("Non-binary data received in SenderUploadWS")
			return
		}

		offsetByte = endByte
	}
}

func (fts *FileTransferSession) ReceiveFileByPump(sessionID string, startByte, endByte int64,
	shutdownPumpSignal <-chan bool) (chan []byte, error) {

	if fts.NumReceivers > 1 {
		return nil, errors.New("only one receiver allow per session")
	}

	// create pump
	receiverChan := make(chan []byte, 2)
	// receiverChan will be close by the goroutine below
	go fts.pump(startByte, endByte, 1000*1024, receiverChan, shutdownPumpSignal)

	// return pump
	return receiverChan, nil
}
