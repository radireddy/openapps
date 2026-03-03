
import { ComponentType } from '../../../../types';
import { IComponentGeneratorStrategy } from './ComponentGeneratorStrategy';
import { ContainerGenerator } from './implementations/ContainerGenerators';
import { ButtonGenerator, InputGenerator, TextareaGenerator, SelectGenerator, CheckboxGenerator, RadioGroupGenerator, SwitchGenerator } from './implementations/InputGenerators';
import { LabelGenerator, ImageGenerator, DividerGenerator, TableGenerator, ListGenerator, FallbackGenerator } from './implementations/DisplayGenerators';

/**
 * Factory class responsible for instantiating the correct component generator based on component type.
 * This uses the Strategy and Factory design patterns to decouple generation logic.
 */
export class ComponentGeneratorFactory {
    private static generators: Partial<Record<ComponentType, IComponentGeneratorStrategy>> = {
        [ComponentType.CONTAINER]: new ContainerGenerator(),
        [ComponentType.LABEL]: new LabelGenerator(),
        [ComponentType.INPUT]: new InputGenerator(),
        [ComponentType.BUTTON]: new ButtonGenerator(),
        [ComponentType.IMAGE]: new ImageGenerator(),
        [ComponentType.TEXTAREA]: new TextareaGenerator(),
        [ComponentType.SELECT]: new SelectGenerator(),
        [ComponentType.CHECKBOX]: new CheckboxGenerator(),
        [ComponentType.DIVIDER]: new DividerGenerator(),
        [ComponentType.RADIO_GROUP]: new RadioGroupGenerator(),
        [ComponentType.SWITCH]: new SwitchGenerator(),
        [ComponentType.TABLE]: new TableGenerator(),
        [ComponentType.LIST]: new ListGenerator(),
    };

    private static fallback = new FallbackGenerator();

    /**
     * Returns the generator strategy for a given component type.
     * @param type The component type to generate code for.
     */
    public static create(type: ComponentType): IComponentGeneratorStrategy {
        return this.generators[type] || this.fallback;
    }
}
