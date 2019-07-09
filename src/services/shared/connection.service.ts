import { Injectable } from '@angular/core';
import { Network } from '@ionic-native/network/ngx';
import { BehaviorSubject, Observable } from 'rxjs';
import { share, publishReplay, publish } from 'rxjs/operators';

export enum ConnectionStatus {
  Online,
  Offline
}

@Injectable({
  providedIn: 'root'
})
export class NetConnectionService {

  private status: BehaviorSubject<ConnectionStatus> = new BehaviorSubject(ConnectionStatus.Offline);

  constructor(private network: Network) {
    this.initializeNetworkEvents();
    const status = this.network.type !== 'none' ? ConnectionStatus.Online : ConnectionStatus.Offline;
    this.status.next(status);
  }

  public initializeNetworkEvents() {

    this.network.onDisconnect().subscribe(() => {
      if (this.status.getValue() === ConnectionStatus.Online) {
        alert('WE ARE OFFLINE');
        this.status.next(ConnectionStatus.Offline);
      }
    });

    this.network.onConnect().subscribe(() => {
      if (this.status.getValue() === ConnectionStatus.Offline) {
        alert('WE ARE ONLINE');
        this.status.next(ConnectionStatus.Online);
      }
    });
  }

  public onNetworkChange(): Observable<ConnectionStatus> {
    return this.status.asObservable();
  }

  public getCurrentNetworkStatus(): ConnectionStatus {
    return this.status.getValue();
  }
}
