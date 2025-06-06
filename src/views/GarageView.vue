<script setup lang="ts">
import ReusableFormComponentVue from '@/components/ReusableFormComponent.vue';
import { useRouter } from 'vue-router';
import { computed, onMounted, ref } from 'vue';
import { garageService, type GarageUnit } from '@/services/GarageService';

const props = defineProps<{
  projectId: string;
  propertyId: string;
  buildingId: string;
  garageId?: string;
}>();

const router = useRouter();
const isEditMode = computed(() => !!props.garageId);

const fields: {
  name: string; // Field key
  label: string; // Label for the field
  type: 'text' | 'textarea' | 'checkbox' | 'select'; // Input type
  options?: any[]; // For dropdowns
  required?: boolean; // Is this field required
  validations?: ((value: any) => string | null)[]; // Array of validation functions
}[] = [
  {
    name: 'title',
    label: 'Garage Title',
    type: 'text',
    required: true,
    validations: [
      (value: any): string | null =>
        typeof value === 'string' && value.length < 3
          ? 'Title must be at least 3 characters long.'
          : null,
    ],
  },
  {
    name: 'description',
    label: 'Description',
    type: 'textarea',
    required: true,
    validations: undefined, // Explicitly define when no validations exist
  },
  {
    name: 'location',
    label: 'Location',
    type: 'textarea',
    required: true,
    validations: undefined,
  },
  {
    name: 'usableSpace',
    label: 'Usable Space (m²)',
    type: 'text',
    required: true,
    validations: [
      (value: any): string | null => {
        const numberValue = Number(value);
        return isNaN(numberValue) || numberValue <= 0
          ? 'Usable Space must be a positive number.'
          : null;
      },
    ],
    options: undefined, // Explicitly define when no options exist
  },
];

const initialValues = ref({
  title: '',
  description: '',
  location: '',
  usableSpace: null,
});

// fetch garage
const fetchGarageData = async () => {
  if (!isEditMode.value || !props.garageId) return;

  try {
    const response: any = await garageService.getGarage(props.projectId, props.garageId);
    // Populate the initialValues
    initialValues.value = {
      title: response.data.title || '',
      description: response.data.description || '',
      location: response.data.location || '',
      usableSpace: response.data.usableSpace || '',
    };
  } catch (error) {
    console.error('Failed to fetch garage data:', error);
    alert('Failed to fetch garage data. Please try again.');
  }
};

const handleSubmit = async (values: Record<string, any>) => {
  // Validate required fields
  if (!values.title || values.title.length < 3) {
    alert('Title is required and must be at least 3 characters.');
    return;
  }

  if (!values.usableSpace || values.usableSpace <= 0) {
    alert('Usable space must be a positive number.');
    return;
  }

  const garage: GarageUnit = {
    title: values.title,
    description: values.description,
    location: values.location,
    usableSpace: parseFloat(values.usableSpace),
  };

  try {
    if (isEditMode.value && props.garageId) {
      // Update existing garage
      const response = await garageService.updateGarage(props.projectId, props.garageId, garage);
      console.log('Garage updated successfully:', response);
      alert('Garage updated successfully!');
    } else {
      console.log('else');

      // create a new garage
      const response = await garageService.createGarage(
        props.projectId,
        props.buildingId,
        garage,
      );
      console.log('Garage created successfully:', response);
      alert('Garage created successfully!');
      router.back();
    }
  } catch (error) {
    console.error('Error submitting garage data:', error);
    alert('Failed to submit garage data. Please try again.');
  }
};
const handleCancel = () => {
  router.back();
};

onMounted(fetchGarageData);
</script>

<template>
  <div>
    <ReusableFormComponentVue
      :headline="isEditMode ? 'Edit Garage Form' : 'Garage Creation Form'"
      :fields="fields"
      :initialValues="initialValues"
      saveButtonText="Save"
      cancelButtonText="Cancel"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />
  </div>
</template>

<style>
.garage-view {
  max-width: 600px;
  margin: 0 auto;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}
</style>
