package server

import (
	"encoding/json"
	"net/http"
	"retifish/server/config"
	log "retifish/server/logger"
	"strconv"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
)

func (s *Server) InitSendHanlder() http.HandlerFunc {
	type response struct {
		SessionID string `json:"sessionID"`
	}

	type JSONBody struct {
		FileName string `json:"fileName"`
		FileSize int64  `json:"fileSize"`
		FileType string `json:"fileType"`
	}

	return func(writer http.ResponseWriter, request *http.Request) {
		var payload JSONBody
		if err := json.NewDecoder(request.Body).Decode(&payload); err != nil {
			respondError(writer, http.StatusBadRequest, "Invalid body.")
			return
		}

		if payload.FileName == "" {
			respondError(writer, http.StatusBadRequest, "No file name.")
			return
		}

		if payload.FileSize <= 0 || payload.FileSize > config.Values.MaxFileSize {
			respondError(writer, http.StatusBadRequest, "Invalid file size.")
			return
		}

		sessionID, err := s.coreController.InitTransferSession(
			payload.FileName, payload.FileType, "NO PASSCODE", payload.FileSize)

		if err != nil {
			respondError(writer, http.StatusInternalServerError, decodeError(err))
			return
		}

		respondJSON(writer, http.StatusCreated, response{sessionID})
	}
}

func (s *Server) WSSendHanlder() http.HandlerFunc {
	upgrader := websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			return true
			// TODO: add return false when session invalid or in used
		},
	}

	return func(writer http.ResponseWriter, request *http.Request) {
		vars := mux.Vars(request)
		sessionID := vars["sessionID"]

		conn, err := upgrader.Upgrade(writer, request, nil)
		if err != nil {
			log.Warn("WS upgrade failed: ", err.Error())
			return
		}

		if err = s.coreController.LoadSenderBroker(sessionID, conn); err != nil {
			log.Warn("Loading WSBroker failed:", err.Error())
			conn.Close()
			return
		}
	}
}

func (s *Server) Receive() http.HandlerFunc {
	type response struct {
		SessionID string `json:"sessionID"`
		FileName  string `json:"fileName"`
		FileSize  int64  `json:"fileSize"`
		FileType  string `json:"fileType"`
	}

	return func(writer http.ResponseWriter, request *http.Request) {
		vars := mux.Vars(request)
		sessionID := vars["sessionID"]

		session, err := s.coreController.GetFileTransferSession(sessionID)
		if err != nil {
			respondError(writer, http.StatusBadRequest, decodeError(err))
			return
		}

		sessionInfo := session.Info()
		// TODO: let receiver through and perform check at receive step 2
		if sessionInfo.NumReceivers > 1 {
			respondError(writer,
				http.StatusForbidden,
				"Session already have a receiver. Please wait for current receiver to finish downloading or ask sender to create a new transfer session.")
			return
		}

		respondJSON(
			writer,
			http.StatusOK,
			response{sessionID, sessionInfo.FileName, sessionInfo.FileSize, sessionInfo.FileType})
	}
}

func (s *Server) Download() http.HandlerFunc {
	return func(writer http.ResponseWriter, request *http.Request) {
		// set default headers (for error case)
		writer.Header().Set("Content-Disposition", "attachment; filename=ERROR")
		writer.Header().Set("Content-Length", "0")

		vars := mux.Vars(request)
		sessionID := vars["sessionID"]

		// TODO: read range header to figure out which part of file to grab
		// TODO: check passcode

		session, err := s.coreController.GetFileTransferSession(sessionID)
		if err != nil {
			log.Warn("Attempting to download from non-existent session:", err.Error())
			writer.WriteHeader(http.StatusNoContent)
			return
		}
		sessionInfo := session.Info()

		session.IncReceiverCounter()
		defer session.DecReceiverCounter()

		receiveChan, err := session.ReceiveFileByPump(sessionID, 0, sessionInfo.FileSize)
		if err != nil {
			writer.WriteHeader(http.StatusNoContent)
			return
		}

		writer.Header().Set("Content-Disposition", "attachment; filename=\""+sessionInfo.FileName+"\"")
		writer.Header().Set("Content-Length", strconv.FormatInt(sessionInfo.FileSize, 10))
		writer.WriteHeader(http.StatusOK) // TODO: allow for partial contents

		for chunk := range receiveChan {
			// chunk has been pulled; write to receiver
			_, err := writer.Write(chunk)
			if err != nil {
				log.Warn("Unable to send data to Receiver:", err.Error())
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

		// TODO: also show configs

		respondJSON(writer, http.StatusOK, s.coreController.Info())
	}
}
