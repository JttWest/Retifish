package server

import (
	"encoding/json"
	"net/http"
	log "retifish/server/logger"
)

func respondJSON(writer http.ResponseWriter, responseCode int, reponseBody interface{}) {
	writer.Header().Set("Content-Type", "application/json")
	writer.WriteHeader(responseCode)
	if err := json.NewEncoder(writer).Encode(reponseBody); err != nil {
		log.Error("Respond JSON failed:", err.Error())
	}
}

type errResponse struct {
	Message string `json:"message"`
}

func respondError(writer http.ResponseWriter, responseCode int, message string) {
	writer.Header().Set("Content-Type", "application/json")
	writer.WriteHeader(responseCode)
	if err := json.NewEncoder(writer).Encode(&errResponse{message}); err != nil {
		log.Error("Respond Error failed:", err.Error())
	}
}
