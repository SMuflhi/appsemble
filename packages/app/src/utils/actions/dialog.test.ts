import { ShowDialogParams } from '../../types';
import { createTestAction } from '../makeActions';

describe('dialog', () => {
  let close: jest.Mock<void, []>;
  let options: ShowDialogParams;
  let showDialog: jest.Mock<() => void, [ShowDialogParams]>;

  beforeEach(() => {
    close = jest.fn();
    showDialog = jest.fn().mockImplementation((opts) => {
      options = opts;
      return close;
    });
  });

  it('should reject if the modal is closed', async () => {
    const action = createTestAction({
      definition: { type: 'dialog', blocks: [] },
      showDialog,
      prefix: 'pages.0.blocks.0.actions.onClick',
    });
    const promise = action({ test: 'input' });
    // Perform a tick
    await Promise.resolve();
    expect(showDialog).toHaveBeenCalledWith({
      actionCreators: { 'dialog.error': expect.any(Function), 'dialog.ok': expect.any(Function) },
      blocks: [],
      closable: true,
      close: expect.any(Function),
      data: { test: 'input' },
      fullscreen: false,
      prefix: 'pages.0.blocks.0.actions.onClick',
    });
    options.close();
    await expect(promise).rejects.toThrow(new Error('closed'));
    expect(close).not.toHaveBeenCalled();
  });

  it('should be possible to tweak the dialog', async () => {
    const action = createTestAction({
      definition: {
        type: 'dialog',
        blocks: [],
        closable: false,
        fullscreen: true,
        title: 'Hello dialog',
      },
      showDialog,
      prefix: 'pages.0.blocks.0.actions.onClick',
    });
    const promise = action({ test: 'input' });
    // Perform a tick
    await Promise.resolve();
    expect(showDialog).toHaveBeenCalledWith({
      actionCreators: { 'dialog.error': expect.any(Function), 'dialog.ok': expect.any(Function) },
      blocks: [],
      closable: false,
      close: expect.any(Function),
      data: { test: 'input' },
      fullscreen: true,
      prefix: 'pages.0.blocks.0.actions.onClick',
      title: 'Hello dialog',
    });
    options.close();
    await expect(promise).rejects.toThrow(new Error('closed'));
    expect(close).not.toHaveBeenCalled();
  });

  it('should resolve if dialog.ok is called', async () => {
    const action = createTestAction({
      definition: { type: 'dialog', blocks: [] },
      showDialog,
      prefix: 'pages.0.blocks.0.actions.onClick',
    });
    const promise = action({ test: 'input' });
    // Perform a tick
    await Promise.resolve();
    expect(showDialog).toHaveBeenCalledWith({
      actionCreators: { 'dialog.error': expect.any(Function), 'dialog.ok': expect.any(Function) },
      blocks: [],
      closable: true,
      close: expect.any(Function),
      data: { test: 'input' },
      fullscreen: false,
      prefix: 'pages.0.blocks.0.actions.onClick',
    });
    await options.actionCreators['dialog.ok'](null)[0]({ value: 'success' }, null);
    await expect(promise).resolves.toStrictEqual({ value: 'success' });
  });

  it('should resolve if dialog.error is called', async () => {
    const action = createTestAction({
      definition: { type: 'dialog', blocks: [] },
      showDialog,
      prefix: 'pages.0.blocks.0.actions.onClick',
    });
    const promise = action({ test: 'input' });
    // Perform a tick
    await Promise.resolve();
    expect(showDialog).toHaveBeenCalledWith({
      actionCreators: { 'dialog.error': expect.any(Function), 'dialog.ok': expect.any(Function) },
      blocks: [],
      closable: true,
      close: expect.any(Function),
      data: { test: 'input' },
      fullscreen: false,
      prefix: 'pages.0.blocks.0.actions.onClick',
    });
    await options.actionCreators['dialog.error'](null)[0]({ value: 'fail' }, null);
    await expect(promise).rejects.toStrictEqual({ value: 'fail' });
  });
});
