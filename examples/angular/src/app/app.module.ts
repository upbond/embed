import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { NgxSpinnerModule } from "ngx-spinner";
import { AppComponent } from "./app.component";
import { ToastrModule } from "ngx-toastr";
@NgModule({
  declarations: [AppComponent],
  imports: [BrowserAnimationsModule, NgxSpinnerModule.forRoot({ type: "ball-scale-multiple" }), ToastrModule.forRoot()],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
