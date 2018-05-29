package config

import (
	"log"
	"reflect"
	"time"

	"github.com/spf13/viper"
)

type Config struct {
	Port                    string
	MaxTransferSessions     int
	SenderConnectWsTimeoutS time.Duration
	TransferChunkSize       int
}

var Values Config

func init() {
	viper.Set("Verbose", true)
	viper.SetConfigType("json")
	viper.SetConfigName("config")
	viper.AddConfigPath("../configuration")
	viper.AddConfigPath(".") // optionally look for config in the working directory

	if err := viper.ReadInConfig(); err != nil {
		log.Fatalln(err.Error())
	}

	if err := viper.Unmarshal(&Values); err != nil {
		log.Fatalln(err.Error())
	}

	// check for any unset config values
	if v := getUnsetValues(); len(v) != 0 {
		log.Fatalln("Missing config:", v)
	}
}

func getUnsetValues() []string {
	var unsetValues []string

	v := reflect.ValueOf(&Values).Elem()
	typeOfConfig := v.Type()
	for i := 0; i < v.NumField(); i++ {
		fieldName := typeOfConfig.Field(i).Name
		if !viper.IsSet(fieldName) {
			unsetValues = append(unsetValues, fieldName)
		}
	}

	return unsetValues
}
