<template>
  <NavBar
    v-model:event-id="eventId"
  >
    <input
      class="form-control"
      type="search"
      placeholder="Search"
      aria-label="Search person"
      v-model="searchContent"
      :disabled="searchDisabled"
    >
    <button
      type="button"
      class="btn btn-info d-flex align-items-center"
      role="button"
      title="Import participants"
      :disabled="loading"
      @click="openImportModal"
    >
      <BiImport class="me-1" aria-hidden="true"/>
      Import
    </button>
  </NavBar>
  <div v-if="loading" class="d-flex justify-content-center m-3">
    <div class="spinner-border" style="width: 6rem; height: 6rem;" role="status">
      <span class="visually-hidden">Loading...</span>
    </div>
  </div>
  <div v-else class="m-3">
    <h2 class="text-center" v-if="people.length === 0">
      <span v-if="searchContent.length === 0">
        Use the search bar to find someone
      </span>

      <span v-else>
        No result for your <code>{{ searchContent }}</code> query, try something else
      </span>
    </h2>

    <PersonCard 
      v-else-if="people.length === 1"
      :person="people[0]"
      @click="sendToDesk(people[0])"
      focused
      :simple="false"
    />

    <table v-else width="100%">
      <thead class="text-center">
        <tr>
          <th>Code</th>
          <th>Firstname</th>
          <th>Lastname</th>
          <th>Company</th>
          <th>Pass</th>
          <th>Used</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="[index, person] in people.entries()"
          :key="index"
          class="result"
          :id="computeId(index)"
          @keydown.down.prevent="focusResult(index + 1)"
          @keydown.up.prevent="focusResult(index - 1)"
          @click="sendToDesk(person)"
          tabindex="0"
        >
          <td>{{ person.code }}</td>
          <td>{{ person.firstname }}</td>
          <td>{{ person.lastname }}</td>
          <td>{{ person.company }}</td>
          <td>{{ person.pass }}</td>
          <td class="text-center">
            <b v-if="person.checkIn != null">Retrieved !</b>
            <i v-else>Not retrieved</i>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <div v-if="alert.visible">
    {{ alert.result }}
  </div>

  <div class="modal" :class="importModal ? 'show d-block' : null" tabindex="-1" @click="closeImportModal">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h1 class="modal-title fs-3">{{ modalLoading ? "Loading..." : "Confirm import" }}</h1>
          <button type="button" class="btn-close" aria-label="Close" @click="closeImportModal"></button>
        </div>
        <div class="modal-body">
          <div v-if="modalLoading" class="d-flex justify-content-center m-3">
            <div class="spinner-border" style="width: 3rem; height: 3rem;" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
          </div>
          <div v-else>The event you are trying to import data from is set to happen during {{ bilhedConfigDate?.format("MMMM YYYY") }}</div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" :disabled="modalLoading" @click="closeImportModal">Cancel</button>
          <button type="button" class="btn btn-primary" :disabled="modalLoading" @click="importParticipants">Confirm</button>
        </div>
      </div>  
    </div>
  </div>

  <div class="toast-container position-fixed top-0 end-0 p-3">
    <div class="toast text-bg-primary" id="importToast" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="toast-header">
        <strong class="me-auto">Data import</strong>
        <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
      <div class="toast-body">
        Imported {{ importReturn }} people
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import axios, { type AxiosResponse } from 'axios';
import type Person from '@/types/Person';
import type BilhedConfig from '@/types/BilhedConfig';
import NavBar from "@/components/NavBar.vue";
import PersonCard from "@/components/PersonCard.vue";
import { Client } from "@stomp/stompjs";
import BiImport from "bootstrap-icons/icons/database-add.svg?component"
import dayjs, { type Dayjs } from 'dayjs';
import { Toast } from 'bootstrap';

export default defineComponent({
  name: "HomeView",

  components: { NavBar, PersonCard, BiImport },

  data() {
    return {
      searchContent: "",
      people: [] as Person[],
      alert: { visible: false, result: {} as Person },
      client: null as Client | null,
      eventId: undefined as Number | undefined,
      loading: false as boolean,
      searchDisabled: false as boolean,
      importModal: false as boolean,
      modalLoading: false as boolean,
      bilhedConfigDate: null as Dayjs | null,
      importReturn: 0 as number,
      toast: null as Toast | null 
    }
  },

  mounted() {
    const url = "ws://" + import.meta.env.VITE_DORIKELL_API_URL + "/api"
    this.client = new Client({
      brokerURL: url
    });
    this.client.activate();
    this.toast = Toast.getOrCreateInstance(
        document.getElementById("importToast") as HTMLElement
      )
  },

  watch: {
    searchContent() {
      if (this.searchContent.length !== 0) {
        this.loading = true;
        const queryParams = new URLSearchParams()
        queryParams.append("q", this.searchContent);
        axios.post(`/api/search/${this.eventId}?${queryParams.toString()}`).then((response: AxiosResponse<Array<Person>>) => {
          this.loading = false;
          this.people = response.data;
        })
      } else {
        this.people = [];
        this.loading = false;
      }
    }
  },

  methods: {
    computeId(index: number): string {
      return 'result-' + index
    },

    focusResult(index: number) {
      if (document.activeElement != null) {
        (document.activeElement as HTMLElement).blur();
      }

      let toFocus = index;
      if (toFocus < 0) {
        toFocus = this.people.length - 1;
      } else if (toFocus >= this.people.length) {
        toFocus = 0;
      }

      this.alert.visible = true;
      this.alert.result = this.people[toFocus];
      document.getElementById(this.computeId(toFocus))?.focus()
    },

    sendToDesk(person: Person) {
      this.client?.publish({
        destination: "/app/checkin",
        body: person.id
      });
      this.resetSearch();
    },

    resetSearch() {
      this.searchContent = '';
    },

    openImportModal() {
      this.importModal = true;
      this.modalLoading = true;
      axios.get("/bilhed/api/config").then((response: AxiosResponse<BilhedConfig>) => {
        this.bilhedConfigDate = dayjs(response.data.closeDate);
        this.modalLoading = false;
      })
    },

    closeImportModal() {
      this.bilhedConfigDate = null;
      this.importModal = false;
    },

    importParticipants() {
      this.loading = true;
      this.searchDisabled = true;

      axios.post("/api/import/" + this.eventId).then((response: AxiosResponse<number>) => {
        this.loading = false;
        this.searchDisabled = false;
        this.closeImportModal();

        this.importReturn = response.data;
        this.toast?.show();
        setTimeout(() => {
          this.toast?.hide();
        }, 2500);
      });
    }
  }
})
</script>

<style>
.result:focus-visible {
  background-color: #FFFFBBBB;
  outline: unset;
  outline-width: 3px;
  outline-color: orangered;
  outline-style: dashed;
}
</style>
