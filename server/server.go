package handler

import (
	"log"
	"net/http"
	"strconv"

	"file-sharing-test/controller"
	"file-sharing-test/model"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
)

// TODO: do in main
// var coreController = controller.NewCore()

// TODO: use Server in main with dependency injection
type Server struct {
	coreController *controller.Core
}

func New(coreController *controller.Core) *Server {
	return &Server{coreController}
}

var upgrader = websocket.Upgrader{
// CheckOrigin: func(r *http.Request) bool {
// 	fmt.Printf("Accepting client from remote address %v\n", r.RemoteAddr)
// 	return true

// 	// TODO: add return false when session invalid or in used
// },
}

var readyUploadMessage = model.Message{Type: "readyUpload"}
var chunkSavedMessage = model.Message{Type: "chunkSaved"}
var uploadCompleteMessage = model.Message{Type: "uploadComplete"}

func (s *Server) Send(writer http.ResponseWriter, request *http.Request) {
	params := request.URL.Query()
	fileName := params.Get("fileName")
	fileSize := params.Get("fileSize")
	passcode := params.Get("passcode")

	if fileName == "" || fileSize == "" {
		writer.WriteHeader(http.StatusBadRequest)
		writer.Write([]byte("Insufficient url parameters."))
		return
	}

	conn, err := upgrader.Upgrade(writer, request, nil)
	if err != nil {
		http.Error(writer, "Unable to set up websocket connection", http.StatusInternalServerError)
		return
	}

	fileSize64, err := strconv.ParseInt(fileSize, 10, 64)
	if err != nil || fileSize64 <= 0 || fileSize64 > 1073741824 {
		http.Error(writer, "Invalid file size", http.StatusBadRequest)
		return
	}

	sessionID_, err := s.coreController.CreateTransferSession(conn, fileName, passcode, fileSize64)

	// ReceiveFileData: // listen for file data in ws until endOfFile is received
	// 	for {
	// 		messageType, wsData, err := conn.ReadMessage()
	// 		if err != nil {
	// 			log.Println(err)
	// 			return
	// 		}

	// 		if messageType == websocket.TextMessage {
	// 			var message model.Message
	// 			err := json.Unmarshal(wsData, &message)
	// 			if err != nil {
	// 				return
	// 			}

	// 			switch message.Type {
	// 			case "startUpload":
	// 				conn.WriteJSON(readyUploadMessage)
	// 			case "endOfFile":
	// 				break ReceiveFileData
	// 			default:
	// 				fmt.Println("Unknown message type: ", message.Type)
	// 				return
	// 			}
	// 		} else if messageType == websocket.BinaryMessage {
	// 			// TODO: pump file data

	// 			conn.WriteJSON(chunkSavedMessage)
	// 		}
	// 	}

	// 	conn.WriteJSON(uploadCompleteMessage)
}

func (s *Server) Receive(writer http.ResponseWriter, request *http.Request) {
	vars := mux.Vars(request)
	sessionID := vars["sessionID"]

	// TODO: read range header to figure out which part of file to grab
	// TODO: check passcode

	session, err := s.coreController.GetFileTransferSession(vars["sessionID"])
	if err != nil {
		http.Error(writer, "Failed to retrieve session", http.StatusBadRequest)
		return
	}

	// start goroutine to pull FileData into FilePump
	session.IncReceiverCounter()
	defer session.DecReceiverCounter()

	shutdownPumpSignal := make(chan bool)
	defer func() { shutdownPumpSignal <- true }()

	receiveChan, err := session.ReceiveFileByPump(sessionID, 0, 1000*1024, shutdownPumpSignal)
	if err != nil {
		http.Error(writer, "Unable to get file from sender", http.StatusBadRequest)
		return
	}

	writer.Header().Set("Access-Control-Expose-Headers", "Content-Disposition")
	writer.Header().Set("Content-Disposition", "attachment; filename=\""+session.FileName+"\"")
	writer.Header().Set("Content-Length", strconv.FormatInt(session.FileSize, 10))
	writer.WriteHeader(http.StatusOK) // TODO: allow for partial contents

	for chunk := range receiveChan {
		// chunk has been pulled; write to receiver
		_, err := writer.Write(chunk)
		if err != nil {
			log.Println("Unable to write to receiver.")
			log.Println(err)
			break
		}
	}
}
