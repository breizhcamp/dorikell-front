<template>
  <div class="card user-select-none" id="person-card" tabindex="0" style="cursor: pointer;">
    <h2 class="card-header" :class="simple ? 'text-center' : ''">
      {{ person.firstname }} {{ person.lastname }}
      <span class="fs-4 float-end" v-if="!simple && person.company">{{ person.company }}</span>
    </h2>
    <span
      v-if="simple"
      class="card-body text-center fw-bold"
      style="font-size: 5em;"
      aria-label="Pass code"
    >{{ person.code }}</span>
    <div v-else class="card-body">
      <div class="fw-bold alert alert-danger d-flex align-items-center" role="alert" v-if="person.checkIn">
        <BiWarning aria-hidden="true" class="me-3 ms-1 big-icon" />
        Already checked in on {{ person.checkIn.calendar().toLocaleLowerCase() }}
      </div>

      <div class="d-flex align-items-center">
        <div class="badge rounded-pill d-inline-flex align-items-center fs-5" :class="'text-bg-' + boostrapColorFromPassType(person.pass)">
          <component :is="iconFromPassType(person.pass)" aria-hidden="true" class="me-1"/>
          {{ labelFromPassType(person.pass) }}
        </div>
        <h4 class="d-inline-block badge text-bg-dark me-1 my-0 ms-auto fw-bold" style="font-size: 3em;" :aria-label="'Code: ' + person.code">{{ person.code }}</h4>
      </div>
    </div>
    <h3 class="card-footer text-center mb-0">
      <span v-if="simple">Click to remove</span>
      <span v-else>Click to send to desk {{ person.desk.name }}</span>
    </h3>
  </div>
</template>

<script setup lang="ts">
import { onMounted, type Component } from "vue";
import type Person from "@/types/Person";
import { PassType } from "@/types/Pass";
import dayjs from "dayjs"
import calendar from "dayjs/plugin/calendar"
import BiWarning from "bootstrap-icons/icons/exclamation-triangle-fill.svg?component"
import BiTwoDays from "bootstrap-icons/icons/2-circle.svg?component";
import BiThreeDays from "bootstrap-icons/icons/3-circle.svg?component";
import BiThreeDaysSponsor from "bootstrap-icons/icons/star.svg?component";
import BiExhibitor from "bootstrap-icons/icons/easel2.svg?component";
import BiStaff from "bootstrap-icons/icons/tools.svg?component";
import BiSpeaker from "bootstrap-icons/icons/person-video3.svg?component";

dayjs.extend(calendar)

export interface Props {
  person: Person,
  focused: boolean,
  simple: boolean
}

const props = defineProps<Props>()

onMounted(() => {
  if (props.focused) {
    (document.activeElement as HTMLElement | null)?.blur();
    (document.getElementById('person-card') as HTMLElement).focus();
  }
})

const iconFromPassType = (passType: PassType): Component => {
  switch (passType) {
    case PassType.TWO_DAYS: 
      return BiTwoDays;
    case PassType.THREE_DAYS: 
      return BiThreeDays;
    case PassType.SPONSOR_THREE_DAYS: 
      return BiThreeDaysSponsor;
    case PassType.EXHIBITOR: 
      return BiExhibitor;
    case PassType.STAFF: 
      return BiStaff;
    case PassType.SPEAKER: 
      return BiSpeaker;
  }
}

const labelFromPassType = (passType: PassType): string => {
  switch (passType) {
    case PassType.TWO_DAYS: 
      return "Two days"
    case PassType.THREE_DAYS: 
      return "Three days"
    case PassType.SPONSOR_THREE_DAYS: 
      return "Three days (Sponsor)"
    case PassType.EXHIBITOR: 
      return "Exhibitor"
    case PassType.STAFF: 
      return "Staff"
    case PassType.SPEAKER: 
      return "Speaker"
  }
}

const boostrapColorFromPassType = (passType: PassType): string => {
  switch (passType) {
    case PassType.TWO_DAYS: 
      return "info"
    case PassType.THREE_DAYS: 
    case PassType.SPONSOR_THREE_DAYS: 
      return "success"
    case PassType.EXHIBITOR: 
      return "secondary"
    case PassType.STAFF: 
      return "warning"
    case PassType.SPEAKER: 
      return "primary"
  }
}
</script>

<style scoped>
#person-card:focus-visible {
  background-color: #FFFFBBBB;
}

#person-card:hover {
  outline: orangered dashed 3px;
}

.big-icon {
  transform: scale(2);
}
</style>
