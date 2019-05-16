import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

import { AppComponent } from './app.component';
import { AppRoutingModule, routingComponents } from './app-routing.module';

import { HomePage } from './home/home.page';

// Services
import { EmployeeService } from 'src/services/employee.service';
import { DepartmentService } from 'src/services/department.service';
import { DesignationService } from 'src/services/designation.service';
import { SkillService } from 'src/services/skill.service';
// Shared Services
import { ApiHeaderService } from 'src/services/shared/apiHeader.service';
import { NetConnectionService } from 'src/services/shared/connection.service';

@NgModule({
  declarations: [AppComponent, HomePage, routingComponents],
  entryComponents: [HomePage],
  imports: [BrowserModule, HttpClientModule, IonicModule.forRoot(), AppRoutingModule],
  providers: [
    StatusBar,
    SplashScreen,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    EmployeeService,
    DepartmentService,
    DesignationService,
    SkillService,
    ApiHeaderService,
    NetConnectionService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
