"use strict";
//import throttle from "lodash.throttle";
import merge from "lodash.merge";
export default {
  /**
   * Instalador
   * @param {Object} Vue la instancia sobre la cual se va a instalar
   */
  install(Vue, options) {
    const myOptions = merge(
      {},
      {
        axiosDefaults: {
          timeout: 10000,
          retry: 3,
          withCredentials: true
        },
        //axios, //si request tiene otro valor se debe definir la función create,
        //puede ser v=>v si no es necesario crearla
        withXHR: true, //solo si se usa el valor por omisión de request
        componentName: "Loading",
        status: {}, //las funciones a ejecutar con este status cuando hay error
        fallBack() {
          alert(this.fallBackText);
          return;
        },
        fallBackText:
          "Hubo un problema al comunicarse con el servicio, por favor revise su conexión o reintente más tarde",
        fallBackTimeOut: 15000
      },
      options
    );
    let {axios, axiosDefaults} = myOptions;
    let {fallBack} = myOptions;

    //restricciones para detenerse
    if (!axios) throw new Error("This plugins needs a axios instance assigned as 'axios'");

    //asignaciones por omisión.
    if (myOptions.withXHR) axios.defaults.headers.common["X-Requested-With"] = "XMLHttpRequest";
    merge(axios.defaults, axiosDefaults);

    //estado
    const state = {
      loading: false,
      loadCount: 0,
      block: false,
      configs: new Map(),
      event: new Vue()
    };

    //definición de componente
    if (myOptions.componentName) {
      Vue.component(myOptions.componentName, () => {
        return Promise.resolve({
          name: myOptions.componentName,
          props: {
            transition: {
              type: String,
              default: "fade"
            },
            color: {
              type: String,
              default: "rgba(255, 255, 255, 0.5)"
            }
          },
          data() {
            return {state};
          },
          render() {
            return (
              <transition name={this.transition}>
                <div v-show={this.state.loading} class="__ITDModal" style={{"background-color": this.color}}>
                  {this.$slots.default ? this.$slots.default : <h1>Waiting slot here</h1>}
                </div>
              </transition>
            );
          }
        });
      });
    }
    //definimos el objeto de interacción.
    const start = () => {
      state.loading = true;
      state.loadCount++;
    };
    const stop = () => {
      state.loadCount--;
      if (state.loadCount <= 0) {
        state.loadCount = 0;
        state.loading = false;
      }
    };
    //helper retry
    const retry = error => {
      const {config, response} = error;
      config.try++;
      if (!config.noBlock) {
        stop();
      }
      //hay respuesta del servidor, evaluar si hay algun trap para el estado.
      if (response) {
        response.body = response.data;
        if (`${response.status}` in myOptions.status) {
          if (myOptions.status[`${response.status}`] === "retry") {
            if (config.try <= config.retry) {
              return axios(config);
            }
          } else return myOptions.status[response.status](config, response);
        }
        return Promise.reject(error);
      }
      //no hay respuesta, se cayó por error de red o timeout
      if (config.try <= config.retry) {
        //aun tiene opciones de reintento
        return axios(config);
      }
      //ya pasó los reintentos, se bloquea el fallback y se ejecuta
      //
      //se ingresa la configuración al Set.
      config.try = 1;
      let result = new Promise((res /*, rej*/) => {
        const {url, method, params, body} = config;
        let key = `${url}${method}${JSON.stringify(params)}${JSON.stringify(body)}`;
        state.configs.set(key, config);
        state.event.$once(key, ev => {
          res(ev);
        });
      });
      if (!state.lock) {
        state.lock = true;
        Promise.resolve(fallBack()).then(() => {
          state.lock = false;
          state.configs.forEach((config, key) => {
            axios(config).then(result => {
              state.configs.delete(key);
              state.event.$emit(key, result);
            });
          });
        });
      }
      return result;
    };
    //interceptores
    axios.interceptors.request.use(config => {
      if (!config.noBlock) {
        //console.log("Blocking", config);
        start();
      }
      config.try = config.try || 1;
      return config;
    });
    axios.interceptors.response.use(response => {
      stop();
      response.body = response.data;
      return response;
    }, retry);
    Vue.prototype.$http = axios;
  }
};
