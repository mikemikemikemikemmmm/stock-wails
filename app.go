package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"time"
)

const dayFuturesURL = "https://www.taifex.com.tw/cht/quotesApi/getQuotes?1776849045139&objId=3"
const nightFuturesURL = "https://www.taifex.com.tw/cht/quotesApi/getQuotes?1776849045139&objId=13"

type RawData struct {
	Time  string `json:"time"`
	Price string `json:"price"`
}

type Data struct {
	Time  string `json:"time"`
	Price uint32 `json:"price"`
}

type App struct {
	ctx context.Context
}

func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

func fetchData(url string) ([]Data, error) {
	resp, err := http.Get(url)
	if err != nil {
		return nil, fmt.Errorf("請求失敗: %v", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("讀取回應失敗: %v", err)
	}

	var rawData []RawData
	if err := json.Unmarshal(body, &rawData); err != nil {
		return nil, fmt.Errorf("解析失敗: %v", err)
	}

	result := make([]Data, len(rawData))
	for i, d := range rawData {
		price, err := strconv.ParseUint(d.Price, 10, 32)
		if err != nil {
			price = 0
		}
		result[i] = Data{
			Time:  d.Time,
			Price: uint32(price),
		}
	}
	return result, nil
}

func isDaySession() bool {
	now := time.Now()
	minutes := now.Hour()*60 + now.Minute()
	return minutes >= 8*60+45 && minutes <= 14*60+59
}

func (a *App) GetData() ([]Data, error) {
	if isDaySession() {
		return fetchData(dayFuturesURL)
	}

	dayData, err := fetchData(dayFuturesURL)
	if err != nil {
		return nil, err
	}
	nightData, err := fetchData(nightFuturesURL)
	if err != nil {
		return nil, err
	}
	return append(dayData, nightData...), nil
}
