package websocketbroker

import (
	log "retifish/server/logger"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

const (
	// Maximum message size allowed from peer.
	maxMessageSize        = 1000 * 1024
	maxNumTransactions    = 10000
	maxReadMessages       = 50
	maxWriteMessages      = 50
	writeWait             = 10 * time.Second
	transactionResultWait = 30 * time.Second
	shutdownCheckRate     = 15 * time.Second
)

type transaction struct {
	message *message
	result  chan<- []byte
}

type WebsocketBroker struct {
	mu           sync.RWMutex
	conn         *websocket.Conn
	running      bool
	transactions chan *transaction
}

func (b *WebsocketBroker) isRunning() bool {
	b.mu.RLock()
	defer b.mu.RUnlock()

	return b.running
}

func (b *WebsocketBroker) cleanup() {
	b.conn.Close()

	for len(b.transactions) > 0 {
		transaction := <-b.transactions
		if transaction.result != nil {
			close(transaction.result)
		}
	}
}

func (b *WebsocketBroker) shutdown() {
	b.mu.Lock()
	defer b.mu.Unlock()

	b.running = false
}

// SubmitTransaction returns the result and flag indicate whether transaction was successfully added to queue.
// Will block until result is ready if resultChan is set.
func (b *WebsocketBroker) SubmitTransaction(message *message, resultChan chan []byte) ([]byte, bool) {
	if !b.isRunning() {
		return nil, false
	}

	// queue transaction or return false if queue is full
	select {
	case b.transactions <- &transaction{message, resultChan}:
	default:
		return nil, false
	}

	if resultChan != nil {
		result, ok := <-resultChan
		return result, ok
	}

	return nil, true
}

func (b *WebsocketBroker) Start() {
	readMessages := make(chan []byte, maxReadMessages)
	go b.readRoutine(readMessages)

	writeMessages := make(chan *message, maxWriteMessages)
	go b.writeRoutine(writeMessages)

	defer func() {
		// clean up broker
		b.shutdown()
		b.cleanup()

		// TODO: can remove this after a few test runs
		if len(b.transactions) > 0 {
			log.Error("WebsocketBroker transactions not cleared after shutdown and cleanup")
		}
	}()

	for {
		select {
		case transaction := <-b.transactions:
			writeMessages <- transaction.message

			if transaction.result != nil {
				select {
				case <-time.After(transactionResultWait):
					log.Error("WebsocketBroker transaction result tiemout")
					return
				case payload, ok := <-readMessages:
					if !ok {
						return
					}
					transaction.result <- payload // MUST NOT BLOCK
				}
			}
		case <-time.After(shutdownCheckRate):
			if !b.isRunning() {
				return
			}
		}
	}
}

func (b *WebsocketBroker) readRoutine(readMessages chan<- []byte) {
	defer func() {
		b.shutdown()

		close(readMessages)
	}()

	for {
		// this is probably not even needed since ws since reading from closed WS errors
		if !b.isRunning() {
			return
		}

		messageType, payload, err := b.conn.ReadMessage()
		if err != nil {
			return
		}

		if messageType == websocket.BinaryMessage {
			if len(payload) > maxMessageSize {
				log.Warn("Terminating WS because client message too large")
				return
			}

			select {
			case readMessages <- payload:
			default:
				log.Error("WebsocketBroker has full binaryIncMessages")
				return
			}
		} else {
			log.Error("Non-binary data received from WS")
			return
		}
	}
}

func (b *WebsocketBroker) writeRoutine(writeMessages <-chan *message) {
	defer func() {
		b.shutdown()
	}()

	for {
		// shutdown this routine if received shutdown signal
		select {
		case <-time.After(shutdownCheckRate):
			if !b.isRunning() {
				return
			}
		case message := <-writeMessages:
			b.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := b.conn.WriteJSON(message); err != nil {
				log.Warn("Unable to write to client WS:", err.Error())
				return
			}
		}
	}
}

func New(conn *websocket.Conn) *WebsocketBroker {
	conn.SetReadLimit(maxMessageSize)

	broker := &WebsocketBroker{
		conn:         conn,
		running:      true,
		transactions: make(chan *transaction, maxNumTransactions),
	}
	// broker.start()

	return broker
}
