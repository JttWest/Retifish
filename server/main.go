package main

import (
	"fmt"
	"net/http"
	"retifish/server/config"
	"retifish/server/controller"
	log "retifish/server/logger"
	"retifish/server/server"

	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
)

func main() {
	// setup logger
	log.SetLevel(config.Values.LogLevel)
	if config.Values.LogToFile {
		log.SetLogToFile("retifish.log")
	}

	serv := server.New(controller.NewCore())

	// TODO: put these in a router package inside server
	router := mux.NewRouter()

	apiRouter := router.PathPrefix("/api").Subrouter()
	apiRouter.HandleFunc("/send", serv.InitSendHanlder()).Methods("POST")
	apiRouter.HandleFunc("/receive/{sessionID}", serv.Receive()).Methods("GET")
	apiRouter.HandleFunc("/download/{sessionID}", serv.Download()).Methods("GET")
	apiRouter.HandleFunc("/info", serv.Info()).Methods("GET")

	wsRouter := router.PathPrefix("/websocket").Subrouter()
	wsRouter.HandleFunc("/send/{sessionID}", serv.WSSendHanlder()).Methods("GET")

	originsOk := handlers.AllowedOrigins([]string{config.Values.CorsAllowOrigin})
	headersOk := handlers.AllowedHeaders([]string{"*"})
	methodsOk := handlers.AllowedMethods([]string{"OPTIONS", "GET", "HEAD", "POST", "PUT"})
	exposeHeaders := handlers.ExposedHeaders([]string{"Content-Length,Content-Range,Content-Disposition"})

	serverHandler := handlers.CORS(originsOk, headersOk, methodsOk, exposeHeaders)(router)

	log.Info("Server started on port", config.Values.Port)
	err := http.ListenAndServe(fmt.Sprintf(":%v", config.Values.Port), serverHandler)
	if err != nil {
		log.Fatal("Unable to create HTTP server:", err.Error())
	}
}
