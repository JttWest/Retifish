package model

import (
	"errors"
	"file-sharing-test/model/message"
	"file-sharing-test/util"
	"log"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

const (
	chunkSize = 500 * 1000
	writeWait = 15 * time.Second
	readWait = 60 * time.Second
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

// pump will begin pulling file data [offsetByte, finishByte) from sender and
// send each pulled chunk through receiverChan
func (fts *FileTransferSession) pump(offsetByte, finishByte int64, chunkSize int,
	receiverChan chan<- []byte, shutdownPumpSignal <-chan bool) {
	
	fts.mu.RLock()
	senderWS := fts.SenderWS
	fts.mu.RUnlock()

	defer func() {
		close(receiverChan) // done pulling chunks
	}()
	
	var endByte int64
	for offsetByte < finishByte {
		endByte = util.MinInt64(offsetByte+int64(chunkSize), finishByte)
		log.Println("offsetByte:", offsetByte, "endByte:", endByte)

		senderWS.SetWriteDeadline(time.Now().Add(writeWait))
		if err := senderWS.WriteJSON(message.NewPullChunk(offsetByte, endByte)); err != nil {
			senderWS.Close()
			return
		}

		senderWS.SetReadDeadline(time.Now().Add(readWait))
		messageType, wsData, err := senderWS.ReadMessage()
		if err != nil {
			log.Println("Failed to get response from pull command. Closing WS.")
			log.Println(err.Error())
			senderWS.Close()
			return
		}

		if messageType == websocket.BinaryMessage {
			if len(wsData) > chunkSize {
				log.Println("File chunk data larger than chunk size!")
				senderWS.Close()
				return
			}

			select {
			case receiverChan <- wsData: // send chunk to receiver
			case <-shutdownPumpSignal:
				return
			}
		} else {
			log.Println("Non-binary data received from senderWS")
			senderWS.Close()
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
	go fts.pump(startByte, endByte, chunkSize, receiverChan, shutdownPumpSignal)

	// return pump
	return receiverChan, nil
}
