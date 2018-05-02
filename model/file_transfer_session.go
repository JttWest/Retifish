package model

import (
	"errors"
	"log"
	"sync"

	"github.com/gorilla/websocket"
)

// FileTransferSession is use to facilitate file transfer b/w sender and receiver
type FileTransferSession struct {
	sync.RWMutex
	FileName     string
	FileSize     int64
	Passcode     string // optional passcode to validate receiver
	NumReceivers int
	SenderWS     *websocket.Conn
}

type FileInfo struct {
	FileName string
	FileSize int64
}

func (fts *FileTransferSession) Info() FileInfo {
	fts.RLock()
	defer fts.RUnlock()

	return FileInfo{fts.FileName, fts.FileSize}
}

func (fts *FileTransferSession) IncReceiverCounter() {
	fts.Lock()
	defer fts.Unlock()

	fts.NumReceivers++
}

func (fts *FileTransferSession) DecReceiverCounter() {
	fts.Lock()
	defer fts.Unlock()

	if fts.NumReceivers == 0 {
		log.Println("ReceiverCounter already 0")
		return
	}

	fts.NumReceivers--
}

var pullChunkMessage = Message{Type: "pullChunk"}

// pump will begin pulling file data [offsetByte, endByte) from sender and
// send each pulled chunk through receiverChan
func (fts *FileTransferSession) pump(offsetByte, endByte int64, chunkSize int,
	receiverChan chan<- []byte, shutdownPumpSignal <-chan bool) {

	fts.RLock()
	sendWS := fts.SenderWS
	fts.RUnlock()

	defer close(receiverChan) // done pulling chunks

	for offsetByte < endByte {
		if err := sendWS.WriteJSON(pullChunkMessage); err != nil {
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

		offsetByte += int64(chunkSize)
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
