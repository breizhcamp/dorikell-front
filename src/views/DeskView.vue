<template>
  <NavBar v-model:event-id="eventId" @update:event-id="(id) => eventId = id"/>
  <ul class="list-group m-3">
    <li 
      class="list-group-item p-0"
      @keydown.up.prevent="focusDisplayedDesk(displayedDesks.size - 1)"
      @keydown.down.prevent="focusDisplayedDesk(0)"
    >
      <button
        id="display-desk-dropdown"
        class="btn d-flex justify-content-between w-100 align-items-center"
        :aria-label="(collapsedDeskOptions ? 'Expand' : 'Collapse') + ' displayed desks'"
        @click="toggleCollapsedDeskOptions()"
      >
        <div class="fw-bold">Displayed desks</div>
        <BiChevronUp v-if="collapsedDeskOptions"/>
        <BiChevronDown v-else/>
      </button>
    </li>
    <li 
      v-for="(desk, index) in (collapsedDeskOptions ? [] : desks)" 
      class="list-group-item"
      @keydown.up.prevent="focusDisplayedDesk(index - 1)"
      @keydown.down.prevent="focusDisplayedDesk(index + 1)"
    >
      <input 
        type="checkbox"
        class="form-check-input me-1"
        :name="'Display desk ' + desk[1].name"
        :id="'display-desk-' + index"
        :checked="displayedDesks.has(desk[0])"
        @change="toggleDisplayedDesk(desk[0])"
      >
      <label :for="'display-desk-' + desk[0]" class="form-check-label stretched-link">{{ desk[1].name }}</label>
    </li>
  </ul>
  <div class="d-flex flex-row m-3">
    <div class="d-flex flex-column flex-fill align-items-center" :style="columnStyle()" v-for="desk in displayedDesks" :key="desk[0]">
      <h3>{{ desk[1].name}}</h3>
      <h4>Codes {{ desk[1].codes.first }} to {{ desk[1].codes.second }}</h4>
      <PersonCard
        class="w-100"
        v-for="person in people.get(desk[0])"
        :key="person[0]"
        :person="person[1]"
        :focused="false"
        @click="remove(person[0])"
        simple
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, type CSSProperties } from 'vue';
import { Client } from "@stomp/stompjs";
import axios, { type AxiosResponse } from "axios"
import NavBar from '@/components/NavBar.vue'
import PersonCard from '@/components/PersonCard.vue'
import type Person from "@/types/Person"
import type Desk from "@/types/Desk"
import BiChevronDown from "bootstrap-icons/icons/chevron-down.svg?component";
import BiChevronUp from "bootstrap-icons/icons/chevron-up.svg?component";

export default defineComponent({
  name: 'DeskView',

  components: { NavBar, PersonCard, BiChevronDown, BiChevronUp },

  data() {
    return {
      client: null as Client | null,
      people: new Map() as Map<string, Map<string, Person>>,
      desks: new Map() as Map<string, Desk>,
      eventId: undefined as Number | undefined,
      collapsedDeskOptions: true,
      displayedDesks: new Map() as Map<string, Desk>
    }
  },

  mounted() {
    this.initWs();
  },

  unmounted() {
    this.client?.deactivate();
  },

  watch: {
    eventId() {
      if (this.eventId != undefined) {
        this.initDesks();
      }
    }
  },

  methods: {
    initWs() {
      const url = "ws://" + import.meta.env.VITE_DORIKELL_API_URL + "/api"
      this.client = new Client({
        brokerURL: url
      });
      this.client.activate();

      this.client.onConnect = () => {
        this.client?.subscribe("/topic/checkin", (message) => {
          const person = JSON.parse(message.body) as Person

          const desk = person.desk;

          if (!this.desks.has(desk.id)) {
            this.desks.set(desk.id, desk);
          }

          let column: Map<string, Person>

          if (this.people.get(person.desk.id) != undefined) {
            column = this.people.get(person.desk.id)!
            column.set(person.id, person)
            this.people.set(person.desk.id, column)
          } else {
            column = new Map<string, Person>();
            column.set(person.id, person);
            this.people.set(person.desk.id, column)
          }

        })

        this.client?.subscribe("/topic/remove", (message) => {
          const personIdToRemove = message.body
          let peopleIter = this.people.values()
          let column = peopleIter.next()
          let removed = false
          while(!column.done && !removed) {
            if (column.value.has(personIdToRemove)) {
              column.value.delete(personIdToRemove)
              removed = true
            }
            column = peopleIter.next();
          }
        })
      }
    },

    initDesks() {
      axios.get("/api/desks/" + this.eventId)
        .then((response: AxiosResponse<Array<Desk>>) => {
          this.desks = new Map(response.data
            .map((desk: Desk) => [desk.id, desk]));
          this.displayedDesks = new Map(this.desks);
        })
    },

    remove(id: string) {
      console.log("Removing person ", id)
      if (this.client?.connected) {
        this.client.publish({
          destination: "/app/remove",
          body: id
        });
      }
    },

    columnStyle(): CSSProperties {
      return { maxWidth: (100 / this.displayedDesks.size) + '%' }
    },

    toggleCollapsedDeskOptions() {
      this.collapsedDeskOptions = !this.collapsedDeskOptions
    },

    toggleDisplayedDesk(deskId: string) {
      if (this.displayedDesks.has(deskId)) {
        this.displayedDesks.delete(deskId);
      } else {
        this.displayedDesks = new Map(
          Array.from(this.desks.entries())
            .filter(entry => 
              entry[0] == deskId || 
              Array.from(this.displayedDesks.keys())
                .includes(entry[0]))
        )
      }
    },

    focusDisplayedDesk(index: number) {
      if (document.activeElement != null) {
        (document.activeElement as HTMLElement).blur()
      }
      if (index < 0 || index >= this.displayedDesks.size) {
        document.getElementById('display-desk-dropdown')?.focus()
      } else {
        document.getElementById('display-desk-' + index)?.focus()
      }
    }
  }
})
</script>
