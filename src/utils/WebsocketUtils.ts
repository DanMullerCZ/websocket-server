import { WebSocket } from "ws";
import { WebsocketMessage } from "../interfaces/WebsocketMessage";

const { randomUUID } = require('crypto'); // Added in: node v14.17.0

/**
 * Singleton class to handle websocket communications
*/
export class WebsocketUtils {
    // singleton things
    private static instance: WebsocketUtils;
    public getInstance() {
        return WebsocketUtils.instance;    
    }

    // client list handler
    /**uuuid (string) => websocket and heartbeat YYYY-MM-DD HH:mm:ss*/
    private clientMap: Map<string, {ws: WebSocket, heartbeat: string}>;

    constructor() {
        if(WebsocketUtils.instance)
            return WebsocketUtils.instance;

        WebsocketUtils.instance = this;

        this.clientMap = new Map<string, {ws: WebSocket, heartbeat: string}>();
    };

    //#region Client Map 
    /**@returns generated UUID*/
    public addNewConnection(newClient: WebSocket): string {
        const uuid = randomUUID() as string;
        this.clientMap.set(uuid, {ws: newClient, heartbeat: this.getNow()});
        return uuid;
    };

    public getClientWebsocket(uuid: string) {
        return this.clientMap.get(uuid);
    };

    public removeClient(uuid: string): boolean {
        return this.clientMap.delete(uuid);
    }

    public updateHeartbeat(uuid: string): boolean {
        const clientData = this.clientMap.get(uuid);
        if(clientData === undefined)
            return false;

        this.clientMap.set(uuid, {
            ws: clientData.ws,
            heartbeat: this.getNow(),
        })
        
        return true;
    }

    public getWholeClientMap() {
        return this.clientMap;
    }

    //#endregion

    //#region Messages 
    public handleMessage(clientUUID: string, msg: WebsocketMessage) {
        let didFail = false;
        switch (msg) {
            case 'ACK':
                // is only for acknoledging requests
                break;
            case 'PING':
                console.log('updating heartbear')
                this.updateHeartbeat(clientUUID);
                break;
            case 'PONG':
                // is message for FE
                break;
            case 'DOWNLOAD_CUSTOMERS':
                // is message for FE
                break;
            case 'DOWNLOAD_DISCOUNTS':
                // is message for FE
                break;
            default:
                console.error(`Server got not yet implemented message: ${msg}`)
                didFail = true;
                break;
        }

        return didFail;
    }

    public sendMessage(ws: WebSocket, msg: WebsocketMessage) {
        ws.send(msg);
    }

    //#endregion

    //#region MISC

    // later on change with dayjs and handle timezones
    private getNow() {
        return (new Date()).toUTCString();
    }

    //#endregion
}
