import "hello_angular/polyfills";
import { Component, NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { FormsModule } from "@angular/forms";
import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";
import { Http, HttpModule } from "@angular/http";
/*jshint multistr: true */

var ProductSearchComponent = Component({
  selector: "mikro-product-search",
  template: '\
    <header> \
      <h1 class="h2">Søgefelt</h1> \
      <small>Sorteret i alfabetisk rækkefølge</small> \
    </header> \
    <section class="search-form"> \
          <label for="keywords" class="sr-only">Keywords</label> \
          <input type="text" id="keywords" name="keywords" \
            placeholder="Søg i titler, undertitler og forfattere" \
            class="form-control input-lg" \
            bind-ngModel="keywords" \
            on-ngModelChange="search($event)"> \
    </section> \
    <section class="search-results" *ngIf="products"> \
      <ol class="list-group"> \
          <li *ngFor="let product of products" \
          class="list-group-item clearfix"> \
            <h3 class="pull-right"> \
              <small>Fra </small> {{product.created_at}} \
            </h3> \
            <h2>{{product.title}}</h2> \
            <h4>{{product.subtitle}}</h4> \
            <h5>{{product.authors}}</h5> \
          </li> \
      </ol> \
    </section> \
    '
}).Class({
  constructor: [
    Http,
    function(http) {
      this.products = null;
      this.http = http;
      this.keywords = "";
    }
  ],
  search: function($event) {
    var self = this; // This is so "this" will be the same in the two functions
    self.keywords = $event;
    if (self.keywords.length < 3) {
      return;
    }
    self.http.get(
      "/products.json?keywords=" + self.keywords
    ).subscribe(
      function(response) {
        self.products = response.json().products;
      },
      function(response) {
        window.alert(response);
      }
    );
  }
});

var ProductAppModule = NgModule({
  imports:      [ BrowserModule, FormsModule, HttpModule ],
  declarations: [ ProductSearchComponent ],
  bootstrap:    [ ProductSearchComponent ]
})
.Class({
  constructor: function() {} 
});

platformBrowserDynamic().bootstrapModule(ProductAppModule);
