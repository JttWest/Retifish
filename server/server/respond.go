package server

import (
	"encoding/json"
	"log"
	"net/http"
)

func respondJSON(writer http.ResponseWriter, responseCode int, reponseBody interface{}) {
	writer.Header().Set("Content-Type", "application/json")
	writer.WriteHeader(responseCode)
	if err := json.NewEncoder(writer).Encode(reponseBody); err != nil {
		log.Println(err.Error())
	}
}

type errResponse struct {
	Message string `json:"sessionID"`
	Display bool   `json:"display"`
}

func respondError(writer http.ResponseWriter, responseCode int, message string) {
	writer.Header().Set("Content-Type", "application/json")
	writer.WriteHeader(responseCode)
	if err := json.NewEncoder(writer).Encode(&errResponse{message, true}); err != nil {
		log.Println(err.Error())
	}
}
