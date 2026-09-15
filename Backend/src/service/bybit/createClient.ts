import { RestClientV5 } from "bybit-api";


const createClient = (apiKey:string, apiSecret:string)=>{
    return new RestClientV5({
        key:apiKey,
        secret:apiSecret,
        demoTrading:true
    })
}

export default createClient;