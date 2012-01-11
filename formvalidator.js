var FormValidator = new Class({
    Implements: Options,
    options:{
       watch_fields : new Array(),
       supported_fields : ['email', 'name', 'username', 'password'],
       username_length : 4,
       watch: true,
	   fieldCallbacks : {},
    },
    formErrors: new Array(),
    elements: new Array(),
    initialize : function(options){
       this.setOptions(options);
        
        if(this.options.watch_fields.length == 0){
            this.options.watch_fields = this.options.supported_fields;
        }
        this.sideTipArr = new Array();
        this.editing = new Array();
        this.vals = new Array();
        this.validate = new Array();
        this.timers = new Array();
        this.buildValidators();
        if(this.options.watch){
           this.init();
         }
    },
    init : function(){
       //have to do some funky setting of display nones to the individual tip elements
       for(var i=0; i<this.options.watch_fields.length;i++){
           var elem = document.id(this.options.watch_fields[i]);
           this.editing[this.options.watch_fields[i]] = false;
           this.vals[this.options.watch_fields[i]] = "";
           if(elem){
              var sideTipChildren = this.getTipChildren(this.options.watch_fields[i]);
               
                sideTipChildren[0].each(function(element){
                    element.setStyle('display', 'none');
                });
                sideTipChildren[1].setStyle('display', 'block');
           }
        }
       this.watch();
    },
    watch : function(){
       for(var i=0; i<this.options.watch_fields.length;i++){
          var elem = document.id(this.options.watch_fields[i]);
          if(elem){
             this.addWatchEvents(this.options.watch_fields[i], elem);
          }
       }
       
    },
    validate : function(type, val, callback){
        console.log("validating");
       this.validate[type](val, callback);
    },
    buildValidators : function(){
       this.validate['email'] = function(val, callback){
          var retVal = 'ok';
          var reg = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
          if(reg.test(val) == false) {
            retVal = 'invalid';
          }
         callback(retVal, 'email');
         
       };
       var username_length = this.options.username_length;
       this.validate['username'] = function(val, callback){
          var retVal = "";
          retVal = 'ok';
          var reg = /[^a-zA-Z0-9\-]/;
          if(reg.test(val) != false || val.length < username_length){
             retVal = 'invalid';
            
          }
          callback(retVal, 'username');
          
         };

         this.validate['gender'] = function(val, callback){
            
            var retVal = "";
           
            if((document.id("male") && document.id("male").getAttribute('checked')) ||
            (document.id("female") && document.id("female").getAttribute('checked'))) {
               retVal = 'ok';
               
             }else{
                retVal = 'blank';
            }
            
            callback(retVal, 'gender');
         };
                  
         this.validate['password'] = function(val, callback){
            var retVal = "";
            
            if(val.length < 6) {
               retVal = 'invalid';
             }else{
                retVal = 'ok';
            }
            
            callback(retVal, 'password');
         };
         this.validate['confirm_password'] = function(val, callback){
            var retVal = "";
            if(document.id("password")){
               if(val != document.id("password").get('value')){
                   retVal = 'invalid';
               }else{
                  retVal = 'ok';
               }
            }else{
               retVal = 'invalid';
            }
            
            callback(retVal, 'confirm_password');
         };
         
         
         this.validate['name'] = function(val, callback){
            var retVal = "";
             var reg = /^([A-Za-z])+/;
             if(reg.test(val) == false) {
               retVal = 'invalid';
             }else{
                retVal = 'ok';
            }

            callback(retVal, 'name');
         };
       
    },
    addWatchEvents : function(type, elem){
         //add the mouse enter the input box tip event
         elem.addEvent('focus', function(event){
            this.displayTip(type, 'tip');
         }.bind(this));
         //on key down they are officially 'editing' the field
         elem.addEvent('keydown', function(event){
            if(!this.editing[type]){
               if(event.key != "tab"){
                  this.displayTip(type, 'tip');
                  this.editing[type] = true;
               }
               if(this.validate[type] &&  this.timers[type]==null){
                   this.timers[type] = this.checkValue.periodical(500,this,type);
               }
            }
         }.bind(this));
         
         //add the 'field left blank' event
         elem.addEvent('blur', function(event){
            if(this.editing[type] == true && elem.get('value') == ""){
               this.displayTip(type, 'blank');
            }
            this.editing[type] = false;
         }.bind(this));
    },
    getTipChildren : function(type, tip){
         if(!this.sideTipArr[type]){
            var obj = document.id("validate_" + type);
            if(obj){
               var sideTip = obj.getChildren('.sidetip');
               if(sideTip){
                  this.sideTipArr[type] = sideTip;
               }
            }
         }
          
          if(tip){
             return this.sideTipArr[type].getFirst('.'+tip);
          }else{
             return [this.sideTipArr[type].getChildren()[0], this.sideTipArr[type]];
          }
    },
    displayTip : function(type, tip){
       var sideTipChildren = this.getTipChildren(type);
         sideTipChildren[0].each(function(element){
            if(element.hasClass(tip)){
               element.setStyle('display', 'block');
            }else if(element.getStyle('display') != 'none'){
               element.setStyle('display', 'none');
            }
         });
    },
    checkValue : function(type){
       var val = document.id(type).get('value');
       if(val){
          if(this.vals[type] != "" && val!= "" && this.vals[type] == val){
             //at this point they have typed something and it hasnt changed for two seconds, so it's time to validate!!
             this.displayTip(type, 'checking');
             this.validate[type](val, function(val){
                 this.displayTip(type, val);
                 //console.log(this.options.fieldCallbacks['username'] + " type: " + type);
                 if(this.options.fieldCallbacks[type]){
                    this.options.fieldCallbacks[type](val);
                 }
                 this.editing[type] = false;
                 clearInterval(this.timers[type]);
                 this.timers[type] = null;
             }.bind(this));
             
          }else{
             this.vals[type] = val;
          // this.timers[type] = setTimeout("this.checkValue("+type+")",3000);
         }
      }
    },
    checkValues : function(callback){
       this.done_count = 0;
       for(var i=0; i<this.options.watch_fields.length;i++){
          var type = this.options.watch_fields[i];
           var elem = document.id(type);
           if(elem){
              var val = elem.get('value');
              //this.addWatchEvents(this.options.watch_fields[i], elem);
               this.validate[type](val, function(val, type){
                   if(val != "ok"){
                       this.displayTip(type, val);
                      this.formErrors[this.formErrors.length] = type;
                   }
                    this.done_count++;
                    if(this.done_count == this.options.watch_fields.length){
                         this.done_count = 0;
                        callback(this.formErrors);
                   }
               }.bind(this));
               
           }
        }
    }
    
    
});