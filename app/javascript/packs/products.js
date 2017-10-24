import "hello_angular/polyfills";
import { Component, NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { FormsModule } from "@angular/forms";
import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";
import { Http, HttpModule } from "@angular/http";
/*jshint multistr: true */

var RESULTS = [
  {
    title: "peters bog",
    subtitle: "en verden ind i noget andet",
    authors: "elektra prat",
    created_at: "2016-02-05"
  },
  {
    title: "Jeg vidste ikke",
    subtitle: "Dengang var jeg",
    authors: "Absolons Mester",
    created_at: "2016-02-02"
  },
  {
    title: "Den gang jeg var",
    subtitle: "Hvorfor vidste du ikker",
    authors: "Sådanne Dorthe",
    created_at: "2016-08-05"
  },
  {
    title: "Bossible",
    subtitle: "En bille slipper løs",
    authors: "Forståelsens forfatter",
    created_at: "2016-02-05"
  },
  {
    title: "Hvorfor nu",
    subtitle: "En smuk verden",
    authors: "elektra prat",
    created_at: "2014-02-05"
  }
];


var ProductSearchComponent = Component({
  selector: "mikro-product-search",
  template: '\
    <header> \
      <h1 class="h2">Søgefelt</h1> \
    </header> \
    <section class="search-form"> \
        <div class="input-group input-group-lg"> \
          <label for="keywords" class="sr-only">Keywords</label> \
          <input type="text" id="keywords" name="keywords" \
            placeholder="Søg i titler, undertitler og forfattere" \
            class="form-control input-lg" \
            bindon-ngModel="keywords"> \
          <span class="input-group-btn"> \
            <input type="submit" value="Find produkt" \
              class="btn btn-primary btn-sm" \
              on-click="search()"> \
          </span> \
        </div> \
    </section> \
    <section class="search-results"> \
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
  search: function() {
    var self = this; // This is so "this" will be the same in the two functions
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
