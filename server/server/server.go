package server

import (
	"retifish/server/controller"
)

// TODO: use Server in main with dependency injection
type Server struct {
	coreController *controller.Core
}

func New(coreController *controller.Core) *Server {
	return &Server{coreController}
}
