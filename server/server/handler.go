package server

import (
	"fmt"
	"log"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
)

func (s *Server) InitSendHanlder() http.HandlerFunc {
	type response struct {
		SessionID string `json:"sessionID"`
	}

	return func(writer http.ResponseWriter, request *http.Request) {
		params := request.URL.Query()
		fileName := params.Get("fileName")
		fileSize := params.Get("fileSize")
		passcode := params.Get("passcode")

		if fileName == "" || fileSize == "" {
			http.Error(writer, "Insufficient url parameters.", http.StatusBadRequest)
			return
		}

		fileSize64, err := strconv.ParseInt(fileSize, 10, 64)
		if err != nil || fileSize64 <= 0 || fileSize64 > 1073741824 {
			http.Error(writer, "Invalid file size.", http.StatusBadRequest)
			return
		}

		sessionID, err := s.coreController.InitTransferSession(fileName, passcode, fileSize64)
		if err != nil {
			http.Error(writer, err.Error(), http.StatusInternalServerError)
			return
		}

		// writer.Header().Set("Content-Type", "application/json")
		// writer.WriteHeader(http.StatusCreated)
		// if err = json.NewEncoder(writer).Encode(&response{sessionID}); err != nil {
		// 	log.Println(err.Error())
		// }

		respondJSON(writer, http.StatusCreated, response{sessionID})
	}
}

func (s *Server) WSSendHanlder() http.HandlerFunc {
	upgrader := websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			fmt.Printf("Accepting client from remote address %v\n", r.RemoteAddr)
			return true

			// TODO: add return false when session invalid or in used
		},
	}

	return func(writer http.ResponseWriter, request *http.Request) {
		params := request.URL.Query()
		sessionID := params.Get("sessionID")

		if sessionID == "" {
			writer.WriteHeader(http.StatusBadRequest)
			writer.Write([]byte("Insufficient url parameters."))
			return
		}

		conn, err := upgrader.Upgrade(writer, request, nil)
		if err != nil {
			log.Println(err.Error())
			return
		}

		if err = s.coreController.LoadSenderBroker(sessionID, conn); err != nil {
			log.Println(err.Error())
			return
		}
	}
}

func (s *Server) Receive() http.HandlerFunc {
	type response struct {
		SessionID string `json:"sessionID"`
		FileName  string `json:"fileName"`
		FileSize  int64  `json:"fileSize"`
		// FileType  string `json:"fileType"`
	}

	return func(writer http.ResponseWriter, request *http.Request) {
		vars := mux.Vars(request)
		sessionID := vars["sessionID"]

		session, err := s.coreController.GetFileTransferSession(sessionID)
		if err != nil {
			respondError(writer, http.StatusBadRequest, "Session does not exist.")
			return
		}

		sessionInfo := session.Info()
		// TODO: let receiver through and perform check at receive step 2
		if sessionInfo.NumReceivers > 1 {
			respondError(writer, http.StatusForbidden, "Session already have a receiver.")
			return
		}

		respondJSON(writer, http.StatusOK, response{sessionID, sessionInfo.FileName, sessionInfo.FileSize})
	}
}

func (s *Server) Download() http.HandlerFunc {
	return func(writer http.ResponseWriter, request *http.Request) {
		writer.Header().Set("Access-Control-Expose-Headers", "Content-Disposition")
		writer.Header().Set("Content-Disposition", "attachment; filename=ERROR")
		writer.Header().Set("Content-Length", "0")

		vars := mux.Vars(request)
		sessionID := vars["sessionID"]

		// TODO: read range header to figure out which part of file to grab
		// TODO: check passcode

		session, err := s.coreController.GetFileTransferSession(sessionID)
		if err != nil {
			log.Println(err.Error())
			// http.Error(writer, "Failed to retrieve session", http.StatusBadRequest)
			writer.WriteHeader(http.StatusNoContent)
			return
		}
		sessionInfo := session.Info()

		session.IncReceiverCounter()
		defer session.DecReceiverCounter()

		receiveChan, err := session.ReceiveFileByPump(sessionID, 0, sessionInfo.FileSize)
		if err != nil {
			// http.Error(writer, "Unable to get file from sender", http.StatusBadRequest)
			writer.WriteHeader(http.StatusNoContent)
			return
		}

		// writer.Header().Set("Access-Control-Expose-Headers", "Content-Disposition")
		writer.Header().Set("Content-Disposition", "attachment; filename=\""+sessionInfo.FileName+"\"")
		writer.Header().Set("Content-Length", strconv.FormatInt(sessionInfo.FileSize, 10))
		writer.WriteHeader(http.StatusOK) // TODO: allow for partial contents

		for chunk := range receiveChan {
			// chunk has been pulled; write to receiver
			_, err := writer.Write(chunk)
			if err != nil {
				log.Println("Unable to write to receiver.")
				log.Println(err)
				return
			}
			writer.(http.Flusher).Flush()
		}
	}
}

// TODO: must protect this endpoint in production
func (s *Server) Info() http.HandlerFunc {
	return func(writer http.ResponseWriter, request *http.Request) {
		pass := request.URL.Query().Get("pass")
		if pass != "D2zJXjQ69WH8xnwxRyNUCkj2axmF4lKb2" {
			http.Error(writer, "", http.StatusUnauthorized)
			return
		}

		respondJSON(writer, http.StatusOK, s.coreController.Info())
	}
}
