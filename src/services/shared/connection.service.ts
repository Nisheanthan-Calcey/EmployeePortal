import { Injectable } from '@angular/core';
import { Network } from '@ionic-native/network/ngx';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class NetConnectionService {
  isConnected: BehaviorSubject<boolean> = new BehaviorSubject(false);

  constructor(private network: Network) {
      const networkType = this.network.type;

      if (networkType === 'none') {
        this.isConnected.next(false);
      } else {
        this.isConnected.next(true);
      }

      this.network.onConnect().subscribe(() => {
        alert('You are now online!');
        this.isConnected.next(true);
      });

      this.network.onDisconnect().subscribe(() => {
        alert('You are now offline!');
        this.isConnected.next(false);
      });
  }

  getConnectionState() {
    return this.isConnected.asObservable();
  }
}
