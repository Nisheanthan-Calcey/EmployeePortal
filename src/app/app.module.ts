import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { Network } from '@ionic-native/network/ngx';
import { SQLitePorter } from '@ionic-native/sqlite-porter/ngx';
import { SQLite } from '@ionic-native/sqlite/ngx';

import { AppComponent } from './app.component';
import { AppRoutingModule, routingComponents } from './app-routing.module';
import { HomePageModule } from './home/home.module';

// Services
import { EmployeeService } from 'src/services/employee.service';
import { DepartmentService } from 'src/services/department.service';
import { DesignationService } from 'src/services/designation.service';
import { SkillService } from 'src/services/skill.service';
// Shared Services
import { ApiHeaderService } from 'src/services/shared/apiHeader.service';
import { NetConnectionService } from 'src/services/shared/connection.service';
import { FormBuilderService } from 'src/services/shared/formBuilder.service';
import { DatabaseService } from 'src/services/shared/database.service';
import { AlertService } from 'src/services/shared/alert.service';


@NgModule({
  declarations: [AppComponent, routingComponents],
  entryComponents: [],
  imports: [HomePageModule, BrowserModule, HttpClientModule, IonicModule.forRoot(), AppRoutingModule, ReactiveFormsModule, FormsModule],
  providers: [
    Network,
    StatusBar,
    SplashScreen,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    SQLite,
    SQLitePorter,
    ApiHeaderService,
    NetConnectionService,
    FormBuilderService,
    DatabaseService,
    AlertService,
    EmployeeService,
    DepartmentService,
    DesignationService,
    SkillService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
