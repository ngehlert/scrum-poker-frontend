import * as io from 'socket.io-client';

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { environment } from '../../../environments/environment';
import { Resettable } from '../../shared/resettable.interface';
import { AuthService } from '../../shared/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class WebSocketService implements Resettable {
    private _socket: SocketIOClient.Socket;
    private _observables: Map<String, Observable<any>> = new Map();

    constructor(
        private _authService: AuthService,
        private _router: Router
    ) {}

    public connect(): void {
        if (this.isConnected()) {
            throw new Error('socket is already connected. disconnect first');
        }
        this._socket = io.connect(environment.api.url, {
            query: {
                token: this._authService.token
           }
        });
        this._socket.on('disconnect', () => {
            this._authService.reset();
            this._router.navigate(['']);
        });
    }

    public isConnected(): boolean {
        return this._socket && this._socket.connected;
    }

    public getObservable(event: string): Observable<any> {
        if (!this._observables.has(event)) {
            const observable = new Observable(observer => {
                this._socket.on(event, (response) => {
                    observer.next(response);
                });
            });
            this._observables.set(event, observable);
        }
        return this._observables.get(event);
    }

    public emit(event: string, message: any, onSuccess?: Function): void {
        this._socket.emit(event, message, function(response) {
            if (onSuccess) {
                onSuccess(response);
            }
        });
    }

    public reset(): void {
        if (this.isConnected()) {
            this._socket.disconnect();
        }
        this._socket = undefined;
        this._observables = new Map();
    }
}