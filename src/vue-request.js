import merge from "lodash.merge";
export default {
  /**
   * Instalador
   * @param {Object} Vue la instancia sobre la cual se va a instalar
   */
  install(Vue, options) {
    const localOptions = merge(
      {},
      {
        axiosDefaults: {
          timeout: 120000,
          retry: 3,
          withCredentials: true,
          timeoutFactor: 1.5
        },
        //axios, //si request tiene otro valor se debe definir la función create,
        //puede ser v=>v si no es necesario crearla
        withXHR: true, //solo si se usa el valor por omisión de request
        componentName: "Loading", //si existe este campo se crea un componente genérico
        //para poder bloquear la interfaz mientras se ejecutan los request.
        status: {}, //las funciones a ejecutar con este status cuando hay error
        fallBack() {
          alert(this.fallBackText);
          return;
        },
        fallBackText:
          "Hubo un problema al comunicarse con el servicio, por favor revise su conexión o reintente más tarde",
        fallBackTimeOut: 15000,
        request: [],
        response: []
        //store,
        //storeName
      },
      options
    );
    console.log("vue-request start");
    const {axios, axiosDefaults, fallBack, componentName, store, storeName} = localOptions;

    //restricciones para detenerse
    if (!axios) throw new Error("This plugins needs an axios instance assigned as 'axios'");

    //asignaciones por omisión.
    if (localOptions.withXHR) axios.defaults.headers.common["X-Requested-With"] = "XMLHttpRequest";
    merge(axios.defaults, axiosDefaults);

    //estado
    //definimos el objeto de interacción.
    const start = state => {
      console.log("start", state);
      state.loading = true;
      state.loadCount++;
    };
    const stop = state => {
      console.log("stop");
      state.loadCount--;
      if (state.loadCount <= 0) {
        state.loadCount = 0;
        state.loading = false;
      }
    };
    const state = {
      loading: false,
      loadCount: 0,
      block: false,
      configs: new Map()
    };
    const event = new Vue();
    const localStoreName = storeName || "request";
    if (store) {
      console.log("tengo store");
      if (store.hasModule(localStoreName))
        throw new Error(
          `vue-request has store but "${localStoreName}" already exists, plase change storeName in options`
        );
      store.registerModule(storeName || "request", {
        namespaced: true,
        state,
        mutations: {
          start,
          stop,
          configSet(state, {key, config}) {
            state.config.set(key, config);
          },
          configGet(state, key) {
            return state.config.get(key);
          },
          configDel(state, key) {
            return state.config.del(key);
          },
          lock(state, val) {
            state.lock = val;
          }
        }
      });
    }
    //definición de componente
    if (componentName) {
      Vue.component(componentName, async () => ({
        name: componentName,
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
        computed: {
          state() {
            if (store) return store.state[localStoreName];
            return state;
          }
        },
        template: `
            <transition name={transition}>
              <div v-show="state.loading" class="__ITDModal" :style="{'background-color': color}">
                <slot>
                  <h1>Waiting slot here</h1>
                </slot>
              </div>
            </transition>`
      }));
    }
    //helper retry
    const retry = error => {
      console.log("retry", error);
      const {config, response} = error;
      config.try++;
      config.timeout *= config.timeoutFactor;
      if (!config.noBlock) {
        store ? store.commit(`${localStoreName}/stop`) : stop(state);
      }
      //hay respuesta del servidor, evaluar si hay algun trap para el estado.
      if (response) {
        response.body = response.data;
        if (`${response.status}` in localOptions.status) {
          if (localOptions.status[`${response.status}`] === "retry") {
            if (config.try <= config.retry) {
              return axios(config);
            }
          } else return localOptions.status[response.status](config, response);
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
        store ? store.commit(`${localStoreName}/configSet`, {key, config}) : state.configs.set(key, config);
        event.$once(key, ev => {
          res(ev);
        });
      });
      if (!(store ? store.state[localStoreName].lock : state.lock)) {
        store ? store.commit(`${localStoreName}/lock`, true) : (state.lock = true);
        Promise.resolve(fallBack(error)).then(() => {
          store ? store.commit(`${localStoreName}/lock`, false) : (state.lock = false);
          let {configs} = store ? store.state[localStoreName] : state;
          configs.forEach((config, key) => {
            axios(config).then(result => {
              store ? store.commit(`${localStoreName}/configDel`, key) : state.configs.delete(key);
              event.$emit(key, result);
            });
          });
        });
      }
      return result;
    };
    //interceptores
    axios.interceptors.request.use(config => {
      if (!config.noBlock) {
        store ? store.commit(`${localStoreName}/start`) : start(state);
      }
      config.try = config.try || 1;
      return config;
    });
    axios.interceptors.response.use(response => {
      store ? store.commit(`${localStoreName}/stop`) : stop(state);
      response.body = response.data;
      return response;
    }, retry);
    localOptions.request.forEach(request =>
      axios.interceptors.request.use[Array.isArray(request) ? "apply" : "call"](axios, request)
    );
    localOptions.response.forEach(response =>
      axios.interceptors.response.use[Array.isArray(response) ? "apply" : "call"](axios, response)
    );

    Vue.prototype.$http = axios;
  }
};
