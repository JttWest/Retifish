package main

import (
	"fmt"
	"log"
	"net/http"
	"retifish/server/config"
	"retifish/server/controller"
	"retifish/server/server"

	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
)

func main() {
	// initialize logger
	log.SetFlags(log.LstdFlags | log.Lshortfile)

	serv := server.New(controller.NewCore())

	// TODO: put these in a router package inside server
	router := mux.NewRouter()

	apiRouter := router.PathPrefix("/api").Subrouter()
	apiRouter.HandleFunc("/send", serv.InitSendHanlder()).Methods("POST")
	apiRouter.HandleFunc("/receive/{sessionID}", serv.Receive()).Methods("GET")
	apiRouter.HandleFunc("/download/{sessionID}", serv.Download()).Methods("GET")
	apiRouter.HandleFunc("/info", serv.Info()).Methods("GET")

	wsRouter := router.PathPrefix("/websocket").Subrouter()
	wsRouter.HandleFunc("/send", serv.WSSendHanlder()).Methods("GET")

	headersOk := handlers.AllowedHeaders([]string{"*"})
	originsOk := handlers.AllowedOrigins([]string{"*"})
	methodsOk := handlers.AllowedMethods([]string{"GET", "HEAD", "POST", "PUT", "OPTIONS"})
	serverHandler := handlers.CORS(originsOk, headersOk, methodsOk)(router)

	log.Println("Server started on port", config.Values.Port)
	err := http.ListenAndServe(fmt.Sprintf(":%v", config.Values.Port), serverHandler)
	if err != nil {
		log.Fatal("Unable to create HTTP server: ", err)
	}
}
