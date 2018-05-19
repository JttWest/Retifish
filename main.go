package main

import (
	"file-sharing-test/controller"
	"file-sharing-test/server"
	"flag"
	"fmt"
	"log"
	"net/http"

	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
)

func main() {
	var PORT string

	flag.StringVar(&PORT, "port", "9090", "specify the port to run on (defaults to 9090)")
	flag.Parse()

	// initialize logger
	log.SetFlags(log.LstdFlags | log.Llongfile)

	serv := server.New(controller.NewCore())

	// TODO: put these in a router package inside server
	router := mux.NewRouter()

	router.HandleFunc("/send", serv.InitSendHanlder()).Methods("POST")
	router.HandleFunc("/send", serv.WSSendHanlder()).Methods("GET")
	router.HandleFunc("/receive/{sessionID}", serv.Receive()).Methods("GET")
	router.HandleFunc("/download/{sessionID}", serv.Download()).Methods("GET")
	router.HandleFunc("/info", serv.Info()).Methods("GET")

	router.PathPrefix("/").Handler(http.FileServer(http.Dir("public/")))

	// TODO: make this a middleware
	// func setupResponse(w *http.ResponseWriter, req *http.Request) {
	// 	(*w).Header().Set("Access-Control-Allow-Origin", "*")
	// 	(*w).Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
	// 	(*w).Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")
	// }

	// cors := cors.New(cors.Options{
	// 	AllowedOrigins: []string{"*"},
	// 	AllowedMethods: []string{"POST, GET, OPTIONS, PUT, DELETE"},
	// 	AllowedHeaders: []string{"*"},
	// 	Debug:          true,
	// })

	// corsHandler := cors.Handler(router)

	headersOk := handlers.AllowedHeaders([]string{"*"})
	originsOk := handlers.AllowedOrigins([]string{"*"})
	methodsOk := handlers.AllowedMethods([]string{"GET", "HEAD", "POST", "PUT", "OPTIONS"})
	serverHandler := handlers.CORS(originsOk, headersOk, methodsOk)(router)

	log.Println("Server started on port", PORT)
	err := http.ListenAndServe(fmt.Sprintf(":%v", PORT), serverHandler)
	if err != nil {
		log.Fatal("Unable to create HTTP server: ", err)
	}
}
