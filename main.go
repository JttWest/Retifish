package main

import (
	"file-sharing-test/controller"
	"file-sharing-test/server"
	"flag"
	"fmt"
	"log"
	"net/http"

	"github.com/gorilla/mux"
)

func main() {
	var PORT string

	flag.StringVar(&PORT, "port", "9090", "specify the port to run on (defaults to 9090)")
	flag.Parse()

	serv := server.New(controller.NewCore())

	r := mux.NewRouter()
	r.HandleFunc("/send", serv.Send)
	r.HandleFunc("/receive/{sessionID}", serv.Receive)
	r.HandleFunc("/info", serv.Info)

	r.PathPrefix("/").Handler(http.FileServer(http.Dir("public/")))
	http.Handle("/", r)

	fmt.Println("Server started on port", PORT)
	err := http.ListenAndServe(fmt.Sprintf(":%v", PORT), nil)
	if err != nil {
		log.Fatal("Unable to create HTTP server: ", err)
	}
}
