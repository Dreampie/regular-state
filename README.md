# regularjs-state


now, use regularjs to create single page application with no pain.


## Example 


```javascript

var stateman = restate();


stateman.state("app", Application)
  .state("app.blog", Blog)
  .state("app.blog", User)
  .state("app.chat", Chat)
  .state("app.chat.detail", Chat)


```



## 









