<template>
  <nav class="navbar bg-dark" data-bs-theme="dark">
    <div class="container-fluid">
      <RouterLink class="navbar-brand" to="/">
        <Logo class="me-1" width="30" height="30"/>
        <h1 class="visually-hidden">Breizhcamp</h1>
        <b aria-hidden="true" >Breizhcamp</b>
      </RouterLink>
      <ul class="navbar-nav me-auto">
        <li class="nav-item">
          <RouterLink class="nav-link" to="/desks">
            Desks
          </RouterLink>
        </li>
      </ul>

      <div class="d-flex gap-2 mx-2">
        <slot></slot>
      </div>

      <div class="d-flex">
        <select :value="eventId" title="Select the current event" class="form-select" @change="e => selectEventId(e)">
          <option v-for="event in events" :value="event.id" :key="event.id">
            {{ event.name }}
          </option>
        </select>
      </div>
    </div>
  </nav>
</template>

<script lang="ts">
import Logo from "@/assets/logo-breizhcamp-icone.svg?component";
import { defineComponent, type PropType } from "vue";
import type NamedEvent from "@/types/NamedEvent";
import axios, { type AxiosResponse } from "axios";

export default defineComponent({
  name: "NavBar",
  components: { Logo },

  emits: ['update:eventId'],

  props: {
    eventId: { type: null as unknown as PropType<Number | undefined> }
  },

  data() {
    return {
      events: [] as NamedEvent[]
    }
  },

  created() {
    this.initEvents();
  },

  methods: {
    initEvents() {
      this.events = []
      let eventIds: number[]

      axios.get('/kalon/events').then((response: AxiosResponse<Array<number>>) => {
        eventIds = response.data;
        eventIds.forEach((id: number) => {
          axios.get('/kalon/events/' + id).then((response: AxiosResponse<NamedEvent>) => {
            this.events.push(response.data);
            if (this.events.length === eventIds.length) {
              this.events = this.events.sort((a, b) => 
                b.year - a.year
              )
              this.$emit('update:eventId', this.events[0].id)
              console.table(this.events)
              console.log(this.eventId)
            }
          })
        })
      })
    },

    selectEventId(e: Event) {
      const value = Number((e.target as HTMLSelectElement).value)
      this.$emit('update:eventId', value)
    }
  }
})
</script>
